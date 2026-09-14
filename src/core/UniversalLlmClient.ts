import { GeminiClient, ChatMessage, GenerationOptions } from './GeminiClient.js';
import { Config } from './Config.js';
import { logger } from './Logger.js';
import { ModelRegistry } from '../models/ModelRegistry.js';
import { ModelRatings } from '../models/ModelRatings.js';
import { withTimeout, getBreaker, LLM_CALL_TIMEOUT_MS, ProviderFallbackChain } from './Resilience.js';
import { OpLog } from './OpLog.js';

export type LlmProvider = 'google' | 'omniroute' | 'openrouter' | 'opencode' | 'huggingface';

/**
 * Strips reasoning tags (<think>...</think>, <thought>...</thought>) and internal planning artifacts.
 */
export function cleanLlmOutput(text: string): string {
  if (!text) return '';
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '') // strip unclosed trailing think tag
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, '') // remove stray Chinese/Asian ideographs
    .trim();

  if (cleaned.startsWith('<think>')) {
    const endIdx = cleaned.indexOf('</think>');
    if (endIdx !== -1) {
      cleaned = cleaned.slice(endIdx + 8).trim();
    }
  }

  const answerMarkerMatch = cleaned.match(/(?:^|\n\n)(?:Ответ|Відповідь|Answer|Response):\s*([\s\S]+)$/i);
  if (answerMarkerMatch && answerMarkerMatch[1]) {
    cleaned = answerMarkerMatch[1].trim();
  }

  return cleaned;
}

/**
 * Free-tier models occasionally return boilerplate moderation stubs instead
 * of real content ('User Safety: safe', etc.) or unrendered reasoning traces.
 * Such junk must not reach the chat — treat it like an empty response so the fallback chain engages.
 */
function isJunkResponse(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (/^user safety[:\s]/.test(t) || /^(safe|unsafe)\.?$/.test(t) || /^\[?no content/i.test(t)) return true;
  if (/^(?:we need to respond|i need to respond|let's craft answer|let's analyze the question|we must respond)/i.test(t) && !t.includes('eva') && !t.includes('evaline')) {
    return true;
  }
  return false;
}

export interface UniversalMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface UniversalGenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  provider?: LlmProvider;
  apiKey?: string;
  signal?: AbortSignal;
}

export class UniversalLlmClient {
  private geminiClient: GeminiClient;

  constructor(apiKeyOrToken?: string) {
    // When paid Vertex traffic is explicitly enabled (EVA_VERTEX_ENABLED=1),
    // do NOT seed the free-tier key as an explicit credential — leave the
    // GeminiClient free to resolve the Vertex bearer per its ONLY-FREE policy.
    const seedKey = apiKeyOrToken || (Config.vertexEnabled ? undefined : Config.geminiApiKey) || undefined;
    this.geminiClient = new GeminiClient(seedKey);
  }

  /**
   * Automatically resolves provider based on model name or explicit option
   */
  public resolveProvider(model: string, explicitProvider?: LlmProvider): LlmProvider {
    if (explicitProvider) {
      return explicitProvider;
    }

    const m = model.toLowerCase();
    if (m.startsWith('omniroute/') || m.startsWith('omni/')) {
      return 'omniroute';
    }
    if (m.startsWith('opencode/')) {
      return 'opencode';
    }
    if (
      m.startsWith('openrouter/') ||
      m.endsWith(':free')
    ) {
      return 'openrouter';
    }

    const modelInfo = ModelRegistry.getModelById(model);
    if (modelInfo) {
      if (
        modelInfo.category.startsWith('OpenRouter') ||
        modelInfo.tier === '100% Free Community' ||
        modelInfo.provider === 'OpenRouter'
      ) {
        return 'openrouter';
      }
      if (modelInfo.category.startsWith('OmniRoute') || modelInfo.tier === 'OmniRoute Daemon' || modelInfo.provider === 'OmniRoute') {
        return 'omniroute';
      }
      if (modelInfo.category.startsWith('OpenCode') || modelInfo.tier === 'OpenCode Platform' || modelInfo.provider === 'OpenCode AI') {
        return 'opencode';
      }
      if (modelInfo.provider === 'Google DeepMind') {
        return 'google';
      }
    }

    if (
      m.startsWith('anthropic/') ||
      m.startsWith('openai/') ||
      m.startsWith('deepseek/') ||
      m.startsWith('qwen/') ||
      m.startsWith('mistralai/') ||
      m.startsWith('microsoft/') ||
      m.startsWith('x-ai/') ||
      m.startsWith('cohere/') ||
      m.startsWith('meta-llama/')
    ) {
      return 'openrouter';
    }

    if (
      m.startsWith('huggingface/') ||
      m.startsWith('hf/')
    ) {
      return 'huggingface';
    }

    return 'google';
  }

  /**
   * Normalizes input messages from either ChatMessage[] or UniversalMessage[] or string
   */
  public normalizeToUniversal(
    input: string | UniversalMessage[] | ChatMessage[]
  ): UniversalMessage[] {
    if (typeof input === 'string') {
      return [{ role: 'user', content: input }];
    }

    if (!Array.isArray(input) || input.length === 0) {
      return [];
    }

    // Check if it's ChatMessage[]
    if ('parts' in input[0]) {
      const chatMsgs = input as ChatMessage[];
      return chatMsgs.map((m) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.parts.map((p) => p.text || '').join('\n'),
      }));
    }

    return input as UniversalMessage[];
  }

  /**
   * Converts UniversalMessage[] to Gemini ChatMessage[] and extracts system prompt
   */
  public toGeminiFormat(
    messages: UniversalMessage[],
    defaultSystem?: string
  ): { contents: ChatMessage[]; systemInstruction?: string } {
    let systemInstruction = defaultSystem;
    const contents: ChatMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = systemInstruction ? `${systemInstruction}\n${msg.content}` : msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    return { contents, systemInstruction };
  }

  /**
   * Strips provider prefixes like 'omniroute/' or 'opencode/' or 'openrouter/' for upstream payload if needed
   */
  private cleanModelId(model: string, provider: LlmProvider): string {
    // NOTE: the LiteLLM daemon serves ids WITH the omni/ prefix (verified
    // live 2026-09-08: /v1/models → 'omni/cf-gpt-oss-120b', …) — never strip
    // 'omni/'. Only the legacy 'omniroute/' alias prefix is stripped.
    if (provider === 'omniroute' && model.startsWith('omniroute/')) {
      return model.replace('omniroute/', '');
    }
    if (provider === 'opencode' && model.startsWith('opencode/')) {
      return model.replace('opencode/', '');
    }
    // Exception: 'openrouter/free' is the REAL upstream model id of the
    // OpenRouter free-models meta-router — the prefix must NOT be stripped.
    if (provider === 'openrouter' && model.startsWith('openrouter/') && model !== 'openrouter/free') {
      return model.replace('openrouter/', '');
    }
    return model;
  }

  /**
   * Internal execution of generateContent for a specific model without fallback
   */
  private async executeGenerate(
    model: string,
    universalMsgs: UniversalMessage[],
    options: UniversalGenerationOptions
  ): Promise<string> {
    const provider = this.resolveProvider(model, options.provider);
    logger.debug('UniversalLlmClient', `Generating unary response via provider: ${provider} [model: ${model}]`);

    if (provider === 'google') {
      const { contents, systemInstruction } = this.toGeminiFormat(
        universalMsgs,
        options.systemInstruction || Config.defaultSystemInstruction
      );
      if (options.apiKey) {
        this.geminiClient.setApiKey(options.apiKey);
      }
      return this.geminiClient.generateContent(model, contents, {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        systemInstruction,
        signal: options.signal,
      });
    }

    if (provider === 'huggingface') {
      return this.generateHuggingFace(model, universalMsgs, options);
    }

    return this.generateOpenAiCompatible(provider, model, universalMsgs, options);
  }

  /**
   * Resilience-wrapped single attempt: hard 45s deadline (hang protection),
   * CircuitBreaker admission check + success/failure recording for the
   * provider resolved from the model id.
   */
  private async attempt(
    model: string,
    universalMsgs: UniversalMessage[],
    options: UniversalGenerationOptions,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const provider = this.resolveProvider(model);
    const breaker = getBreaker(provider);
    if (!breaker.canAttempt()) {
      throw new Error(`[CIRCUIT_OPEN] provider "${provider}" breaker is open — skipping attempt for ${model}`);
    }
    const p = onChunk
      ? this.executeStream(model, universalMsgs, onChunk, options)
      : this.executeGenerate(model, universalMsgs, options);
    const t0 = Date.now();
    const timeoutMs = onChunk ? 90000 : LLM_CALL_TIMEOUT_MS;
    try {
      const rawResult = await withTimeout(p, timeoutMs, `llm:${provider}:${model}`);
      const result = cleanLlmOutput(rawResult);
      if (isJunkResponse(result)) {
        throw new Error(`[JUNK_RESPONSE] ${model} returned boilerplate instead of content`);
      }
      breaker.recordSuccess();
      OpLog.getInstance().log('debug', 'llm', `provider=${provider} model=${model} latencyMs=${Date.now() - t0} ok`);
      return result;
    } catch (err: any) {
      breaker.recordFailure(err);
      OpLog.getInstance().log('error', 'llm', `provider=${provider} model=${model} latencyMs=${Date.now() - t0} fail: ${err.message}`);
      throw err;
    }
  }

  /**
   * Generates content with automatic ranked fallback on failure
   */
  public async generateContent(
    model: string,
    messages: string | UniversalMessage[] | ChatMessage[],
    options: UniversalGenerationOptions = {},
    enableFallback: boolean = true
  ): Promise<string> {
    const universalMsgs = this.normalizeToUniversal(messages);
    try {
      return await this.attempt(model, universalMsgs, options);
    } catch (err: any) {
      if (!enableFallback) throw err;

      const resilience = new ProviderFallbackChain();
      const fallbackChain = resilience.filterHealthy(ModelRatings.getFallbackChain(model));
      logger.warn('UniversalLlmClient', `Model "${model}" failed: ${err.message}. Initiating ranked fallback chain (${fallbackChain.length} healthy candidates)...`);

      for (const fallbackModel of fallbackChain) {
        try {
          logger.info('UniversalLlmClient', `[FALLBACK] Attempting ranked candidate: ${fallbackModel}`);
          return await this.attempt(fallbackModel, universalMsgs, options);
        } catch (fallbackErr: any) {
          logger.warn('UniversalLlmClient', `[FALLBACK] Candidate "${fallbackModel}" failed: ${fallbackErr.message}`);
        }
      }

      throw new Error(`All models in ranked fallback chain failed. Last error: ${err.message}`);
    }
  }

  /**
   * Internal execution of streamContent for a specific model without fallback
   */
  private async executeStream(
    model: string,
    universalMsgs: UniversalMessage[],
    onChunk: (chunk: string) => void,
    options: UniversalGenerationOptions
  ): Promise<string> {
    const provider = this.resolveProvider(model, options.provider);
    logger.debug('UniversalLlmClient', `Streaming response via provider: ${provider} [model: ${model}]`);

    if (provider === 'google') {
      const { contents, systemInstruction } = this.toGeminiFormat(
        universalMsgs,
        options.systemInstruction || Config.defaultSystemInstruction
      );
      if (options.apiKey) {
        this.geminiClient.setApiKey(options.apiKey);
      }
      return this.geminiClient.streamContent(model, contents, onChunk, {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        systemInstruction,
        signal: options.signal,
      });
    }

    return this.streamOpenAiCompatible(provider, model, universalMsgs, onChunk, options);
  }

  /**
   * Streams content chunk-by-chunk via SSE with automatic ranked fallback on failure
   */
  public async streamContent(
    model: string,
    messages: string | UniversalMessage[] | ChatMessage[],
    onChunk: (chunk: string) => void,
    options: UniversalGenerationOptions = {},
    enableFallback: boolean = true,
    onFallback?: (fromModel: string, toModel: string) => void,
    onProgress?: (event: { step: string; detail: string; model?: string }) => void
  ): Promise<string> {
    const universalMsgs = this.normalizeToUniversal(messages);

    const runAttemptWithBuffer = async (targetModel: string) => {
      const initialBuffer: string[] = [];
      let initialBufferText = '';
      let isStreamReleased = false;
      let chunksEmitted = 0;
      let firstChunkReceived = false;
      let ttftTimer: NodeJS.Timeout | null = null;

      const trackedChunk = (chunk: string) => {
        if (!firstChunkReceived) {
          firstChunkReceived = true;
          if (ttftTimer) {
            clearTimeout(ttftTimer);
            ttftTimer = null;
          }
          onProgress?.({ step: 'generating', detail: `Генерация ответа [${targetModel}]...`, model: targetModel });
        }

        if (isStreamReleased) {
          chunksEmitted++;
          onChunk(chunk);
          return;
        }

        initialBuffer.push(chunk);
        initialBufferText += chunk;

        const lower = initialBufferText.trim().toLowerCase();
        if (lower.startsWith('user safety') || lower.startsWith('safe') || lower.startsWith('unsafe')) {
          if (initialBufferText.length < 25) {
            return;
          }
        }

        isStreamReleased = true;
        for (const b of initialBuffer) {
          chunksEmitted++;
          onChunk(b);
        }
        initialBuffer.length = 0;
      };

      onProgress?.({ step: 'connecting', detail: `Подключение к модели ${targetModel}...`, model: targetModel });

      const streamPromise = this.attempt(targetModel, universalMsgs, options, trackedChunk);
      const ttftPromise = new Promise<never>((_, reject) => {
        ttftTimer = setTimeout(() => {
          if (!firstChunkReceived) {
            reject(new Error(`[TTFT_TIMEOUT] Model ${targetModel} stalled (no tokens within 6s)`));
          }
        }, 6000);
      });

      let attemptResult: { result: string; chunksEmitted: number };
      try {
        const rawResult = await Promise.race([streamPromise, ttftPromise]);
        const result = typeof rawResult === 'string' ? rawResult : '';

        if (!result.trim() && chunksEmitted === 0) {
          getBreaker(this.resolveProvider(targetModel)).recordFailure(new Error('[EMPTY_STREAM] no content'));
          throw new Error(`[EMPTY_STREAM] ${targetModel} returned no content (reasoning-only response)`);
        }

        if (!isStreamReleased && !isJunkResponse(result)) {
          isStreamReleased = true;
          for (const b of initialBuffer) {
            chunksEmitted++;
            onChunk(b);
          }
          initialBuffer.length = 0;
        }

        attemptResult = { result, chunksEmitted };
      } finally {
        if (ttftTimer) clearTimeout(ttftTimer);
      }

      return attemptResult;
    };

    try {
      const { result } = await runAttemptWithBuffer(model);
      return result;
    } catch (err: any) {
      if (!enableFallback) {
        throw err;
      }

      const resilience = new ProviderFallbackChain();
      const fallbackChain = resilience.filterHealthy(ModelRatings.getFallbackChain(model));
      logger.warn('UniversalLlmClient', `Stream for model "${model}" failed before output: ${err.message}. Initiating ranked fallback...`);

      for (const fallbackModel of fallbackChain) {
        try {
          logger.info('UniversalLlmClient', `[STREAM FALLBACK] Trying candidate: ${fallbackModel}`);
          if (onFallback) onFallback(model, fallbackModel);
          onProgress?.({ step: 'fallback', detail: `Автопереключение: ${model} недоступна ➔ ${fallbackModel}...`, model: fallbackModel });
          const { result } = await runAttemptWithBuffer(fallbackModel);
          return result;
        } catch (fallbackErr: any) {
          logger.warn('UniversalLlmClient', `[STREAM FALLBACK] Candidate "${fallbackModel}" failed: ${fallbackErr.message}`);
        }
      }

      throw new Error(`Stream fallback chain exhausted. Last error: ${err.message}`);
    }
  }

  /**
   * Handles OpenAI-compatible providers: OmniRoute, OpenRouter, OpenCode Go
   */
  private getProviderEndpointConfig(
    provider: 'omniroute' | 'openrouter' | 'opencode',
    optionsApiKey?: string
  ): { url: string; headers: Record<string, string> } {
    if (provider === 'omniroute') {
      const url = `${Config.omnirouteBaseUrl}/chat/completions`;
      const apiKey = optionsApiKey || Config.omnirouteApiKey || 'omniroute-token';
      return {
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      };
    }

    if (provider === 'openrouter') {
      const url = `${Config.openrouterBaseUrl}/chat/completions`;
      const apiKey = optionsApiKey || Config.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';
      return {
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://evabot.online',
          'X-Title': 'EvaBot Autonomous Agent',
        },
      };
    }

    // opencode (OpenCode Go)
    const url = `${Config.opencodeBaseUrl}/chat/completions`;
    const apiKey = optionsApiKey || Config.opencodeApiKey || process.env.OPENCODE_API_KEY || 'opencode-token';
    return {
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Client': 'EvaBot-OpenCode-Go-Adapter',
      },
    };
  }

  private buildOpenAiMessages(
    messages: UniversalMessage[],
    systemInstruction?: string
  ): { role: string; content: string }[] {
    const formatted: { role: string; content: string }[] = [];
    const effectiveSystem = systemInstruction || Config.defaultSystemInstruction;

    if (effectiveSystem) {
      formatted.push({ role: 'system', content: effectiveSystem });
    }

    for (const msg of messages) {
      formatted.push({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        content: msg.content,
      });
    }

    return formatted;
  }

  private async generateOpenAiCompatible(
    provider: 'omniroute' | 'openrouter' | 'opencode',
    model: string,
    messages: UniversalMessage[],
    options: UniversalGenerationOptions
  ): Promise<string> {
    const { url, headers } = this.getProviderEndpointConfig(provider, options.apiKey);
    const targetModel = this.cleanModelId(model, provider);
    const payload = {
      model: targetModel,
      messages: this.buildOpenAiMessages(messages, options.systemInstruction),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutputTokens ?? 4096,
      stream: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorDetail = errText;
      try {
        const json = JSON.parse(errText);
        errorDetail = json.error?.message || json.message || errText;
      } catch {
        // use raw
      }
      logger.error('UniversalLlmClient', `${provider} API Error ${response.status}: ${errorDetail}`);
      throw new Error(`${provider.toUpperCase()} API Error (${response.status}): ${errorDetail}`);
    }

    const data: any = await response.json();
    let output = data.choices?.[0]?.message?.content;
    if (typeof output !== 'string' || !output.trim()) {
      const reasoning = data.choices?.[0]?.message?.reasoning;
      if (typeof reasoning === 'string' && reasoning.trim()) {
        output = reasoning;
      } else {
        return '[No content returned by model]';
      }
    }
    return cleanLlmOutput(output);
  }

  private async generateHuggingFace(
    model: string,
    messages: UniversalMessage[],
    options: UniversalGenerationOptions
  ): Promise<string> {
    // Hugging Face Inference API
    const apiKey = options.apiKey ?? Config.hfToken;
    if (!apiKey) {
      throw new Error('HuggingFace API token not configured');
    }
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const payload = {
      inputs: messages.map((m) => m.content).join('\n\n'),
      parameters: {
        temperature: options.temperature ?? 0.7,
        max_new_tokens: options.maxOutputTokens ?? 4096,
      },
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorDetail = errText;
      try {
        const json = JSON.parse(errText);
        errorDetail = json.error || json.message || errText;
      } catch {
        // use raw
      }
      logger.error('UniversalLlmClient', `HuggingFace API Error ${response.status}: ${errorDetail}`);
      throw new Error(`HuggingFace API Error (${response.status}): ${errorDetail}`);
    }

    const data: any = await response.json();
    let output = '';
    if (Array.isArray(data) && data.length > 0) {
      output = data[0].generated_text || '';
    } else if (typeof data === 'object' && data.generated_text) {
      output = data.generated_text;
    }
    if (typeof output !== 'string' || !output.trim()) {
      return '[No content returned by HuggingFace model]';
    }
    return cleanLlmOutput(output);
  }

  private async streamOpenAiCompatible(
    provider: 'omniroute' | 'openrouter' | 'opencode' | 'huggingface',
    model: string,
    messages: UniversalMessage[],
    onChunk: (chunk: string) => void,
    options: UniversalGenerationOptions
  ): Promise<string> {
    const { url, headers } = this.getProviderEndpointConfig(provider, options.apiKey);
    const targetModel = this.cleanModelId(model, provider);
    const payload = {
      model: targetModel,
      messages: this.buildOpenAiMessages(messages, options.systemInstruction),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutputTokens ?? 4096,
      stream: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorDetail = errText;
      try {
        const json = JSON.parse(errText);
        errorDetail = json.error?.message || json.message || errText;
      } catch {
        // use raw
      }
      logger.error('UniversalLlmClient', `${provider} Stream Error ${response.status}: ${errorDetail}`);
      throw new Error(`${provider.toUpperCase()} Stream Error (${response.status}): ${errorDetail}`);
    }

    if (!response.body) {
      throw new Error(`Empty response body from ${provider}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // Buffer fragment
          }
        }
      }
    }

    // Process leftover buffer
    if (buffer.trim().startsWith('data: ')) {
      const dataStr = buffer.trim().slice(6).trim();
      if (dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // ignore
        }
      }
    }

    return fullText;
  }
}
