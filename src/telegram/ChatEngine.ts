import { UniversalLlmClient, LlmProvider, UniversalMessage } from '../core/UniversalLlmClient.js';
import { Config } from '../core/Config.js';
import { KnowledgeBaseConnector } from '../core/CorporateRoles.js';
import { rulesEngine } from '../core/RulesEngine.js';
import { applyLocalePolicy, languageLockInstruction, detectMessageLanguage } from '../core/LocalePolicy.js';
import { ChatHistoryStore } from '../core/ChatHistoryStore.js';
import { I18nEngine, SupportedLocale } from '../core/I18nEngine.js';
import { logger } from '../core/Logger.js';
import { SystemContext, recordLastUsedModel } from '../core/SystemContext.js';
import { DeveloperMode } from '../core/DeveloperMode.js';
import { AutoModelRouter } from '../core/AutoModelRouter.js';

/**
 * Thin chat-engine facade shared by the Telegram transport.
 *
 * ChatRouter is tightly coupled to the HTTP request/response cycle (SSE writes,
 * status codes, rate-limit headers), so instead of reusing it directly we expose
 * the same underlying units it composes — UniversalLlmClient, KnowledgeBaseConnector,
 * RulesEngine and ChatHistoryStore — as a plain async `respond()` call that any
 * non-HTTP transport can drive. Keep this in sync with ChatRouter.resolveSystemInstruction.
 */
export interface ChatEngineRequest {
  message: string;
  sessionId: string;
  locale?: SupportedLocale;
  model?: string;
  provider?: LlmProvider;
  useHistory?: boolean;
  useKnowledgeBase?: boolean;
}

export interface ChatEngineResponse {
  text: string;
  model: string;
  sessionId: string;
}

export class ChatEngine {
  private kbConnector: KnowledgeBaseConnector;
  private client: UniversalLlmClient;
  private historyLimit: number;

  constructor(options: { apiKey?: string; model?: string; historyLimit?: number } = {}) {
    this.client = new UniversalLlmClient(options.apiKey || (Config.vertexEnabled ? undefined : Config.geminiApiKey) || undefined);
    this.kbConnector = new KnowledgeBaseConnector();
    this.historyLimit = options.historyLimit ?? 12;
  }

  public resolveSystemInstruction(): string {
    // Default Telegram persona: Eva (the Face of the company) — Config.defaultSystemInstruction already speaks as Eva.
    const base = Config.defaultSystemInstruction;
    const withLocale = applyLocalePolicy(base, 'eva');
    const withRules = `${withLocale}\n${rulesEngine.compileRulesInstruction()}`;
    return withRules;
  }

  public async respond(request: ChatEngineRequest): Promise<ChatEngineResponse> {
    const { message, sessionId, locale } = request;

    const store = ChatHistoryStore.getInstance();
    let history: Array<{ role: string; content: string }> = [];
    // Role 'system' records are context injections (e.g. via /add context) —
    // they must never be sent as user turns; they are merged into the system
    // instruction instead.
    let systemNotes: string[] = [];
    if (request.useHistory !== false) {
      try {
        const rawHistory = store.getSessionHistory(sessionId, this.historyLimit);
        systemNotes = rawHistory
          .filter((rec) => rec.role === 'system')
          .map((rec) => rec.content)
          .filter((c) => c.trim().length > 0);
        history = rawHistory
          .filter((rec) => rec.role !== 'system')
          .map((rec) => ({ role: rec.role === 'assistant' ? 'assistant' : 'user', content: rec.content }));
      } catch (err: any) {
        logger.warn('ChatEngine', `History load skipped for ${sessionId}: ${err.message}`);
      }
    }

    // TASK-320: /auto mode — when the session opted in and no explicit model
    // was requested, pick the best FREE model for this message + history.
    let targetModel = request.model || Config.defaultModel;
    if (!request.model && AutoModelRouter.isActive(sessionId)) {
      targetModel = AutoModelRouter.pick({ message, history, historyLimit: this.historyLimit }, sessionId).modelId;
    }
    const useKnowledgeBase = request.useKnowledgeBase !== false;
    const useHistory = request.useHistory !== false;

    // Track the actually-used model for SystemContext (FEATURE 1).
    recordLastUsedModel(targetModel, this.client.resolveProvider(targetModel, request.provider));

    let effectiveInstruction = this.resolveSystemInstruction();

    const detectedLang = detectMessageLanguage(message);
    if (useKnowledgeBase) {
      try {
        const docs = await this.kbConnector.search(message, { limit: 3, language: detectedLang });
        if (docs.length > 0) {
          effectiveInstruction += `\n${this.kbConnector.formatContextForPrompt(docs)}`;
        }
      } catch (err: any) {
        logger.warn('ChatEngine', `KB retrieval skipped for ${sessionId}: ${err.message}`);
      }
    }

    // System-awareness (FEATURE 1) + developer block (FEATURE 2), appended
    // after the existing system prompt building (LocalePolicy/rules/KB).
    const sysCtx = SystemContext.build();
    const locSysCtx = SystemContext.build(detectedLang);
    effectiveInstruction += `\n${sysCtx}`;
    if (locSysCtx !== sysCtx) effectiveInstruction += `\n${locSysCtx}`;
    // LANGUAGE LOCK: mirror the user's message language (uk/ru/en/pl) — the bot
    // must never answer in a different language without an explicit request.
    effectiveInstruction += `\n${languageLockInstruction(message)}`;
    if (DeveloperMode.isUnlocked(sessionId)) {
      effectiveInstruction += `\n${SystemContext.DEVELOPER_BLOCK}\n${SystemContext.developerBlock(detectedLang)}`;
    }
    if (systemNotes.length > 0) {
      effectiveInstruction += `\n\n[SESSION CONTEXT INJECTED BY USER]\n${systemNotes.join('\n')}`;
    }

    const messages: UniversalMessage[] = [
      ...history.map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as UniversalMessage['role'],
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ];
    const responseText = await this.client.generateContent(targetModel, messages, {
      systemInstruction: effectiveInstruction,
      provider: request.provider,
    });

    this.persist(sessionId, 'user', message.trim(), targetModel, locale);
    this.persist(sessionId, 'assistant', responseText, targetModel, locale);

    return { text: responseText, model: targetModel, sessionId };
  }

  private persist(sessionId: string, role: string, content: string, model: string, locale?: SupportedLocale): void {
    try {
      ChatHistoryStore.getInstance().appendMessage({
        sessionId,
        role,
        content: DeveloperMode.maskPasswordIn(content),
        model,
        lang: locale || I18nEngine.getLocale(),
      });
    } catch (err: any) {
      logger.warn('ChatEngine', `Chat history persistence skipped: ${err.message}`);
    }
  }
}
