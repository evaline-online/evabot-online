import type {
  AppConfig,
  BootBannerPayload,
  BootReport,
  ChatStreamEvent,
  ConsiliumMode,
  CostEstimate,
  GeminiModelInfo,
  HealthPayload,
  ModelsPayload,
  PersonaId,
  VoiceConfigPayload,
} from './models';

export class CatalogStore {
  private static models: GeminiModelInfo[] = [];
  private static categories: string[] = [];
  private static defaultModel: string = 'gemini-2.5-flash';
  private static loaded = false;

  static async load(): Promise<void> {
    if (CatalogStore.loaded) return;
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = (await res.json()) as ModelsPayload;
        CatalogStore.models = data.models;
        CatalogStore.categories = data.categories;
        if (data.defaultModel) CatalogStore.defaultModel = data.defaultModel;
        CatalogStore.loaded = true;
      }
    } catch (e) {
      console.warn('[CatalogStore] Failed to load model catalog:', e);
    }
  }

  static isLoaded(): boolean {
    return CatalogStore.loaded;
  }

  static getAll(): GeminiModelInfo[] {
    return CatalogStore.models;
  }

  static getCategories(): string[] {
    return CatalogStore.categories;
  }

  static getByCategory(category: string): GeminiModelInfo[] {
    return CatalogStore.models.filter((m) => m.category === category);
  }

  static getById(id: string): GeminiModelInfo | undefined {
    return CatalogStore.models.find((m) => m.id === id);
  }

  static getDefault(): string {
    return CatalogStore.defaultModel;
  }

  static async fetchTopModels(scope: 'top10_paid' | 'top10_free'): Promise<GeminiModelInfo[]> {
    try {
      const res = await fetch(`/api/models?scope=${scope}`);
      if (res.ok) {
        const data = (await res.json()) as ModelsPayload;
        return data.models;
      }
    } catch (e) {
      console.warn(`[CatalogStore] Failed to fetch ${scope}:`, e);
    }
    return [];
  }
}

export async function fetchHealth(): Promise<HealthPayload | null> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) return (await res.json()) as HealthPayload;
  } catch {
    // Backend offline
  }
  return null;
}

export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) return (await res.json()) as AppConfig;
  } catch (e) {
    console.warn('[Config] Could not fetch /api/config:', e);
  }
  return null;
}

export async function setServerDevMode(enabled: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/config/dev-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      const data = (await res.json()) as { devMode: boolean };
      return data.devMode;
    }
  } catch (e) {
    console.warn('[Config] dev-mode toggle failed:', e);
  }
  return false;
}

export async function fetchBootBannerText(): Promise<string | null> {
  try {
    const res = await fetch('/api/text/boot-banner');
    if (res.ok) {
      const data = (await res.json()) as BootBannerPayload;
      return data.content || null;
    }
  } catch (e) {
    console.warn('[Config] Could not fetch boot banner:', e);
  }
  return null;
}

export async function fetchBootDiagnostics(model: string): Promise<BootReport | null> {
  try {
    const res = await fetch(`/api/diagnostics/boot?model=${encodeURIComponent(model)}`);
    if (res.ok) return (await res.json()) as BootReport;
  } catch (e) {
    console.warn('Boot diagnostics probe offline:', e);
  }
  return null;
}

export async function fetchVoiceConfig(): Promise<VoiceConfigPayload | null> {
  try {
    const res = await fetch('/api/voice/config');
    if (res.ok) return (await res.json()) as VoiceConfigPayload;
  } catch (e) {
    console.warn('[VoiceDockUI] Could not fetch voice config from server:', e);
  }
  return null;
}

export async function toggleVoicePlugin(enabled: boolean): Promise<void> {
  await fetch('/api/voice/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  }).catch(() => {});
}

export interface ChatStreamHandlers {
  onChunk: (text: string) => void;
  onError: (message: string) => void;
  onDone: (fullText: string, usage?: ChatStreamEvent['usage'], cost?: CostEstimate) => void;
}

export async function streamChat(
  body: {
    message: string;
    model: string;
    persona: PersonaId;
    role: string;
    lang: string;
    db: string;
    mode: ConsiliumMode;
    history?: Array<{ role: string; parts: Array<{ text: string }> }>;
    apiKey?: string;
  },
  handlers: ChatStreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body }),
    signal,
  });

  if (!response.ok) {
    const errJson = (await response.json().catch(() => ({ error: 'Transmission error' }))) as { error?: string };
    throw new Error(errJson.error || `HTTP ${response.status}`);
  }
  if (!response.body) throw new Error('Readable stream not supported');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let buffer = '';
  let usage: ChatStreamEvent['usage'];
  let cost: CostEstimate | undefined;
  let doneText = '';
  let finalSeen = false;

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
        if (!dataStr) continue;
        let event: ChatStreamEvent;
        try {
          event = JSON.parse(dataStr) as ChatStreamEvent;
        } catch {
          continue;
        }
        if (event.chunk) {
          accumulatedText += event.chunk;
          handlers.onChunk(accumulatedText);
        } else if (event.error) {
          accumulatedText += `\n\n[Error: ${event.error}]`;
          handlers.onChunk(accumulatedText);
          handlers.onError(event.error);
        }
        if (event.usage) usage = event.usage;
        if (event.cost) cost = event.cost;
        if (event.done) {
          doneText = event.fullText ?? accumulatedText;
          finalSeen = true;
        }
      }
    }
  }

  if (!finalSeen) doneText = accumulatedText;
  handlers.onDone(doneText, usage, cost);
}

export interface ConsiliumResult {
  mode?: string;
  persona?: string;
  consensus?: string;
  interviewResult?: { score: number; rating: string; feedback: string; nextQuestion?: string };
  turns?: Array<Record<string, any>>;
  costSummary?: {
    models: string[];
    totalTokens: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCostUSD: number;
    totalCostEUR: number;
    formattedUSD: string;
    formattedEUR: string;
  };
  [key: string]: unknown;
}

export async function runConsilium(
  payload: {
    prompt: string;
    mode: string;
    persona: PersonaId;
    preset?: 'top10_paid' | 'top10_free';
    participants: number;
    apiKey?: string;
    useKnowledgeBase: boolean;
  },
  signal: AbortSignal,
): Promise<ConsiliumResult> {
  const response = await fetch('/api/consilium', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errJson = (await response.json().catch(() => ({ error: 'Consilium execution failed' }))) as { error?: string };
    throw new Error(errJson.error || `HTTP ${response.status}`);
  }
  const data = (await response.json()) as { result: ConsiliumResult };
  return data.result;
}
