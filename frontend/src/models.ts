export interface ModelPricing {
  freeTierStatus: string;
  freeTierDetails: string;
  inputPer1MTokensUSD: string;
  outputPer1MTokensUSD: string;
  inputPer1MTokensEUR: string;
  outputPer1MTokensEUR: string;
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  codingStrengths: string;
  contextWindow: number;
  maxOutputTokens: number;
  recommended: boolean;
  tier: string;
  protocol: string;
  pricing: ModelPricing;
}

export interface CostEstimate {
  modelId: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
  costEUR: number;
  commercialValueUSD: number;
  commercialValueEUR: number;
  isFreeTier: boolean;
  formattedUSD: string;
  formattedEUR: string;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatStreamEvent {
  chunk?: string;
  error?: string;
  done?: boolean;
  fullText?: string;
  model?: string;
  usage?: ChatUsage;
  cost?: CostEstimate;
}

export interface HealthPayload {
  status: string;
  version: string;
  server: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  availableModels: number;
  devMode: boolean;
  hasServerApiKey: boolean;
  authSource: string;
  account: string;
  supportedProviders: string[];
  omnirouteEndpoint: string;
  availableRolesCount: number;
}

export interface AppConfig {
  productName: string;
  version: string;
  server: string;
  base: string;
  localePolicy: {
    currencies: string[];
    financialStandard: string;
    zeroTolerance?: string;
  };
  devMode: boolean;
  defaultModel: string;
  availableModels: number;
  supportedProviders: string[];
  voice: {
    enabled: boolean;
    activePersona: string;
  };
  commands: Array<{ cmd: string; desc: string }>;
  dev?: {
    runtime: {
      bootTimeEpochSec: number;
      env: {
        DEV_MODE: boolean;
        GEMINI_API_KEY_SET: boolean;
        OMNIROUTE_ENDPOINT: string;
        OPENROUTER_KEY_SET: boolean;
      };
    };
  };
}

export interface BootBannerPayload {
  type: string;
  content: string;
  generatedAt: string;
}

export interface ModelsPayload {
  models: GeminiModelInfo[];
  categories: string[];
  defaultModel: string;
}

export interface BootStep {
  name: string;
  status: 'success' | 'skipped' | 'failed';
  latencyMs: number;
  details: string;
}

export interface BootReport {
  timestamp: string;
  activeModel: string;
  version: string;
  steps: BootStep[];
  totalDurationMs: number;
  passed: number;
  skipped: number;
  failed: number;
}

export interface VoiceConfigPayload {
  enabled: boolean;
  model: string;
  endpoint: string;
  activePersona: 'eva' | 'adam' | 'auto';
  sampleRateInput: number;
  sampleRateOutput: number;
  apiKey: string;
  systemInstruction: string;
  voiceName: string;
  personas: Record<
    string,
    {
      id: string;
      name: string;
      gender: string;
      voiceName: string;
      title: string;
      role: string;
      description: string;
      systemPrompt: string;
    }
  >;
}

export type ConsiliumMode = 'chat' | 'dialog' | 'interview' | 'consilium';
export type PersonaId = 'eva' | 'adam' | 'dual';
export type RoleId =
  | 'eva_frontend'
  | 'adam_backend'
  | 'ceo'
  | 'cto'
  | 'ciso'
  | 'cfo'
  | 'devops_sre'
  | 'data_ai_lead'
  | 'qa_automation'
  | 'legal_compliance';
