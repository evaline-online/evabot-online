import { GeminiLiveClient } from './GeminiLiveClient';
import { VoiceVisualizer } from './VoiceVisualizer';
import type { VoicePersonaId } from './GeminiLiveClient';
import { fetchVoiceConfig, toggleVoicePlugin } from '../api';

interface VoicePersonaSpec {
  id: string;
  name: string;
  gender: string;
  voiceName: string;
  title: string;
  role: string;
  description: string;
  systemPrompt: string;
}

export class VoiceDockUI {
  private container: HTMLElement | null = null;
  private client: GeminiLiveClient | null = null;
  private visualizer: VoiceVisualizer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isEnabled: boolean = true;
  private activePersona: VoicePersonaId = 'eva';
  private currentApiKey: string = '';
  private personas: Record<string, VoicePersonaSpec> = {};
  private serverModel: string = 'models/gemini-2.0-flash-exp';
  private serverEndpoint: string =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

  constructor() {
    this.currentApiKey = localStorage.getItem('evabot_gemini_key') || '';
  }

  public async init(): Promise<void> {
    const config = await fetchVoiceConfig();
    if (config) {
      this.isEnabled = config.enabled ?? true;
      if (!this.currentApiKey && config.apiKey) {
        this.currentApiKey = config.apiKey;
      }
      if (config.activePersona) {
        this.activePersona = config.activePersona === 'auto' ? 'eva' : config.activePersona;
      }
      if (config.personas) {
        this.personas = config.personas;
      }
      if (config.model) this.serverModel = config.model;
      if (config.endpoint) this.serverEndpoint = config.endpoint;
    }

    this.render();
    this.setupEventListeners();
  }

  public setApiKey(key: string): void {
    this.currentApiKey = key;
    if (this.client) {
      this.client.setApiKey(key);
    }
  }

  public setPersona(persona: VoicePersonaId): void {
    this.activePersona = persona;
    this.updatePersonaButtons();

    const spec = persona !== 'auto' ? this.personas[persona] : undefined;
    if (spec) {
      if (this.client) {
        this.client.setPersonaSpec(spec.voiceName, spec.systemPrompt);
      }
    } else if (this.client) {
      this.client.switchPersona(persona).catch(() => {});
    }

    if (this.visualizer) {
      this.visualizer.setPersonaTheme(persona === 'adam' ? 'adam' : 'eva');
    }

    void fetch('/api/voice/persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona }),
    }).catch(() => {});
  }

  public togglePlugin(enabled?: boolean): void {
    this.isEnabled = typeof enabled === 'boolean' ? enabled : !this.isEnabled;

    void toggleVoicePlugin(this.isEnabled);

    const dock = document.getElementById('voice-live-dock');
    if (dock) {
      dock.style.display = this.isEnabled ? 'block' : 'none';
    }

    const toggleBtn = document.getElementById('voice-plugin-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = this.isEnabled ? '[ PLUGIN: ON 🟢 ]' : '[ PLUGIN: OFF ⚪ ]';
      toggleBtn.classList.toggle('active', this.isEnabled);
    }

    if (!this.isEnabled && this.client) {
      this.client.disconnect();
    }
  }

  private render(): void {
    let dock = document.getElementById('voice-live-dock');
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'voice-live-dock';
      dock.className = 'cyber-voice-dock';
      document.body.appendChild(dock);
    }

    this.container = dock;
    this.container.style.display = this.isEnabled ? 'block' : 'none';

    this.container.innerHTML = `
      <div class="voice-dock-header">
        <div class="voice-dock-title">
          <span class="voice-dock-pulse"></span>
          <span>GEMINI LIVE // NEURAL VOICE ENGINE</span>
          <span class="voice-dock-badge">v2.0 MULTIMODAL</span>
        </div>
        <div class="voice-dock-actions">
          <button id="voice-plugin-toggle-btn" class="voice-dock-btn small ${this.isEnabled ? 'active' : ''}">
            ${this.isEnabled ? '[ PLUGIN: ON 🟢 ]' : '[ PLUGIN: OFF ⚪ ]'}
          </button>
          <button id="voice-dock-minimize-btn" class="voice-dock-btn small">[ – ]</button>
        </div>
      </div>

      <div id="voice-dock-body" class="voice-dock-body">
        <div class="voice-persona-selector">
          <button id="voice-select-eva" class="persona-tab-btn ${this.activePersona === 'eva' ? 'active' : ''}">
            <span class="persona-indicator">♀</span>
            <strong>EVA (Ева)</strong>
            <span class="persona-sub">Aoede • FrontEnd & UX</span>
          </button>
          <button id="voice-select-adam" class="persona-tab-btn ${this.activePersona === 'adam' ? 'active' : ''}">
            <span class="persona-indicator">♂</span>
            <strong>ADAM (Адам)</strong>
            <span class="persona-sub">Fenrir • BackEnd & Cloud</span>
          </button>
        </div>

        <div class="voice-visualizer-container">
          <canvas id="voice-canvas" width="480" height="90"></canvas>
          <div id="voice-status-overlay" class="voice-status-overlay">READY TO CONNECT</div>
        </div>

        <div class="voice-controls-row">
          <button id="voice-main-mic-btn" class="voice-mic-btn">
            <span class="mic-icon">🎙️</span>
            <span id="voice-mic-label" class="mic-label">START VOICE STREAM</span>
            <span class="mic-shortcut">[Alt+V]</span>
          </button>
          <button id="voice-disconnect-btn" class="voice-dock-btn" style="display:none;">
            [ DISCONNECT ]
          </button>
        </div>

        <div class="voice-langs-bar">
          <span class="langs-label">LANGUAGES:</span>
          <span class="lang-tag">UK (Українська)</span>
          <span class="lang-tag">EN (English)</span>
          <span class="lang-tag">RU (Русский)</span>
          <span class="lang-tag">PL (Polski)</span>
          <span class="lang-tag">RO (Română)</span>
        </div>

        <div class="voice-transcript-wrapper">
          <div class="voice-transcript-title">LIVE NEURAL TRANSCRIPTION:</div>
          <div id="voice-transcript-stream" class="voice-transcript-stream">
            <div class="transcript-placeholder">Direct audio streaming ready. Press button or say "Ева" / "Адам" to speak.</div>
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('voice-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.visualizer = new VoiceVisualizer(this.canvas);
      this.visualizer.setPersonaTheme(this.activePersona === 'adam' ? 'adam' : 'eva');
      this.visualizer.start();
    }
  }

  private setupEventListeners(): void {
    document.getElementById('voice-plugin-toggle-btn')?.addEventListener('click', () => {
      this.togglePlugin();
    });

    const minBtn = document.getElementById('voice-dock-minimize-btn');
    const dockBody = document.getElementById('voice-dock-body');
    minBtn?.addEventListener('click', () => {
      if (dockBody) {
        const isCollapsed = dockBody.style.display === 'none';
        dockBody.style.display = isCollapsed ? 'block' : 'none';
        if (minBtn) minBtn.textContent = isCollapsed ? '[ – ]' : '[ + ]';
      }
    });

    document.getElementById('voice-select-eva')?.addEventListener('click', () => {
      this.setPersona('eva');
    });

    document.getElementById('voice-select-adam')?.addEventListener('click', () => {
      this.setPersona('adam');
    });

    const micBtn = document.getElementById('voice-main-mic-btn');
    micBtn?.addEventListener('click', () => {
      void this.handleMicButtonClick();
    });

    document.getElementById('voice-disconnect-btn')?.addEventListener('click', () => {
      if (this.client) {
        this.client.disconnect();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        void this.handleMicButtonClick();
      }
    });
  }

  private async handleMicButtonClick(): Promise<void> {
    if (!this.client) {
      await this.initClient();
    }
    if (!this.client) return;

    if (this.client.getIsMicActive()) {
      this.client.stopMic();
    } else {
      try {
        await this.client.startMic();
      } catch (err: any) {
        this.updateStatusOverlay(`Error: ${err.message || 'Microphone error'}`);
      }
    }
  }

  private async initClient(): Promise<void> {
    const apiKey = this.currentApiKey || localStorage.getItem('evabot_gemini_key') || '';
    if (!apiKey) {
      const promptKey = prompt(
        'Enter Google Gemini API Key for Gemini Live Multimodal Voice (stored locally in browser):',
        '',
      );
      if (promptKey && promptKey.trim()) {
        this.currentApiKey = promptKey.trim();
        localStorage.setItem('evabot_gemini_key', this.currentApiKey);
      } else {
        alert('Gemini API key is required to stream Gemini Live voice.');
        return;
      }
    }

    const spec = this.personas[this.activePersona] || this.personas['eva'];
    const activePersona = this.activePersona === 'auto' ? 'eva' : this.activePersona;

    this.client = new GeminiLiveClient({
      apiKey: this.currentApiKey,
      model: this.serverModel,
      endpoint: this.serverEndpoint,
      voiceName: spec?.voiceName || 'Aoede',
      systemInstruction: spec?.systemPrompt || '',
      persona: activePersona,
      onTranscript: (role, text) => {
        this.appendTranscript(role, text);
      },
      onStatusChange: (status, detail) => {
        this.handleStatusChange(status, detail);
      },
      onPersonaChange: (newPersona) => {
        this.activePersona = newPersona;
        this.updatePersonaButtons();
        if (this.visualizer) {
          this.visualizer.setPersonaTheme(newPersona === 'adam' ? 'adam' : 'eva');
        }
      },
    });

    if (this.visualizer) {
      this.visualizer.setAnalysers(this.client.getRecorder().getAnalyser(), this.client.getPlayer().getAnalyser());
    }
  }

  private handleStatusChange(status: string, detail?: string): void {
    const overlay = document.getElementById('voice-status-overlay');
    const micBtn = document.getElementById('voice-main-mic-btn');
    const micLabel = document.getElementById('voice-mic-label');
    const disconnectBtn = document.getElementById('voice-disconnect-btn');

    if (disconnectBtn) {
      disconnectBtn.style.display = status !== 'disconnected' ? 'inline-block' : 'none';
    }

    if (this.visualizer) {
      if (status === 'listening') {
        this.visualizer.setMode('listening');
      } else if (status === 'speaking') {
        this.visualizer.setMode('speaking');
      } else {
        this.visualizer.setMode('idle');
      }
    }

    switch (status) {
      case 'connecting':
        if (overlay) overlay.textContent = 'CONNECTING TO GEMINI LIVE...';
        if (micBtn) micBtn.classList.remove('active', 'speaking');
        if (micLabel) micLabel.textContent = 'CONNECTING...';
        break;
      case 'connected':
        if (overlay) overlay.textContent = `LIVE CONNECTED • ${this.activePersona.toUpperCase()}`;
        if (micBtn) micBtn.classList.remove('active', 'speaking');
        if (micLabel) micLabel.textContent = 'MUTE / TAP TO TALK';
        break;
      case 'listening':
        if (overlay) overlay.textContent = 'LISTENING TO MICROPHONE...';
        if (micBtn) {
          micBtn.classList.add('active');
          micBtn.classList.remove('speaking');
        }
        if (micLabel) micLabel.textContent = 'LIVE STREAMING [ACTIVE]';
        break;
      case 'speaking':
        const personaName = this.activePersona === 'adam' ? 'ADAM (♂)' : 'EVA (♀)';
        if (overlay) overlay.textContent = `${personaName} IS SPEAKING...`;
        if (micBtn) micBtn.classList.add('speaking');
        if (micLabel) micLabel.textContent = `${personaName} TRANSMITTING`;
        break;
      case 'disconnected':
        if (overlay) overlay.textContent = detail ? `DISCONNECTED: ${detail}` : 'OFFLINE • READY';
        if (micBtn) micBtn.classList.remove('active', 'speaking');
        if (micLabel) micLabel.textContent = 'START VOICE STREAM';
        break;
      case 'error':
        if (overlay) overlay.textContent = `ERROR: ${detail || 'Unknown'}`;
        if (micBtn) micBtn.classList.remove('active', 'speaking');
        if (micLabel) micLabel.textContent = 'RETRY VOICE STREAM';
        break;
    }
  }

  private updateStatusOverlay(text: string): void {
    const overlay = document.getElementById('voice-status-overlay');
    if (overlay) overlay.textContent = text;
  }

  private updatePersonaButtons(): void {
    const evaBtn = document.getElementById('voice-select-eva');
    const adamBtn = document.getElementById('voice-select-adam');
    if (evaBtn) evaBtn.classList.toggle('active', this.activePersona === 'eva');
    if (adamBtn) adamBtn.classList.toggle('active', this.activePersona === 'adam');
  }

  private appendTranscript(role: string, text: string): void {
    const stream = document.getElementById('voice-transcript-stream');
    if (!stream) return;

    const placeholder = stream.querySelector('.transcript-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const line = document.createElement('div');
    line.className = `transcript-line ${role}`;

    const personaTag = role === 'model' ? (this.activePersona === 'adam' ? '[ADAM ♂]' : '[EVA ♀]') : '[YOU 🎙️]';

    line.innerHTML = `
      <span class="transcript-time">${time}</span>
      <strong class="transcript-tag">${personaTag}:</strong>
      <span class="transcript-text">${this.escapeHtml(text)}</span>
    `;

    stream.appendChild(line);
    stream.scrollTop = stream.scrollHeight;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public destroy(): void {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    if (this.visualizer) {
      this.visualizer.stop();
      this.visualizer = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
