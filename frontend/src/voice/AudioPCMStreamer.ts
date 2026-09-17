export class AudioPCMRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isRecording: boolean = false;
  private onChunkCallback: ((base64Pcm16: string) => void) | null = null;
  private analyserNode: AnalyserNode | null = null;

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public async start(onChunk: (base64Pcm16: string) => void): Promise<void> {
    if (this.isRecording) return;
    this.onChunkCallback = onChunk;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;

    const bufferSize = 4096;
    this.processorNode = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording || !this.onChunkCallback) return;
      const inputData = e.inputBuffer.getChannelData(0);

      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      const buffer = new Uint8Array(pcm16.buffer);
      let binary = '';
      const len = buffer.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      const base64 = btoa(binary);
      this.onChunkCallback(base64);
    };

    this.sourceNode.connect(this.analyserNode);
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);

    this.isRecording = true;
  }

  public stop(): void {
    this.isRecording = false;
    this.onChunkCallback = null;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

export class AudioPCMPlayer {
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private activeSources: AudioBufferSourceNode[] = [];
  private onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;

  constructor(onStateChange?: (isPlaying: boolean) => void) {
    if (onStateChange) this.onPlaybackStateChange = onStateChange;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private initContext(): void {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.connect(this.audioCtx.destination);
      this.nextPlayTime = this.audioCtx.currentTime;
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public playChunk(base64Pcm: string): void {
    this.initContext();
    if (!this.audioCtx || !this.analyserNode) return;

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyserNode);

      const currentTime = this.audioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.onPlaybackStateChange?.(true);
      }

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0 && this.audioCtx && this.audioCtx.currentTime >= this.nextPlayTime - 0.05) {
          this.isPlaying = false;
          this.onPlaybackStateChange?.(false);
        }
      };
    } catch (e) {
      console.warn('Failed to decode/play PCM chunk:', e);
    }
  }

  public stop(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
    if (this.isPlaying) {
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
    }
  }

  public close(): void {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
