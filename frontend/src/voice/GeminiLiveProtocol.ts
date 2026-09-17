export interface LiveClientContentSetup {
  setup: {
    model: string;
    generationConfig?: {
      responseModalities?: ('AUDIO' | 'TEXT')[];
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            voiceName: string;
          };
        };
      };
      temperature?: number;
      topP?: number;
      topK?: number;
    };
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
    tools?: Array<Record<string, any>>;
  };
}

export interface LiveClientRealtimeInput {
  realtimeInput: {
    mediaChunks: Array<{
      mimeType: string;
      data: string;
    }>;
  };
}

export interface LiveClientContentTurn {
  clientContent: {
    turns: Array<{
      role: 'user';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }>;
    turnComplete: boolean;
  };
}

export type LiveClientMessage = LiveClientContentSetup | LiveClientRealtimeInput | LiveClientContentTurn;

export interface LiveServerContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface LiveServerContent {
  modelTurn?: {
    parts: LiveServerContentPart[];
  };
  turnComplete?: boolean;
  interrupted?: boolean;
}

export interface LiveServerMessage {
  serverContent?: LiveServerContent;
  toolCall?: any;
  toolCallCancellation?: any;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}
