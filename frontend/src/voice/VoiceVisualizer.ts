export class VoiceVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private recorderAnalyser: AnalyserNode | null = null;
  private playerAnalyser: AnalyserNode | null = null;
  private mode: 'idle' | 'listening' | 'speaking' = 'idle';
  private personaTheme: 'eva' | 'adam' = 'eva';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not obtain 2D canvas context');
    this.ctx = context;
  }

  public setAnalysers(recorder: AnalyserNode | null, player: AnalyserNode | null): void {
    this.recorderAnalyser = recorder;
    this.playerAnalyser = player;
  }

  public setMode(mode: 'idle' | 'listening' | 'speaking'): void {
    this.mode = mode;
  }

  public setPersonaTheme(theme: 'eva' | 'adam'): void {
    this.personaTheme = theme;
  }

  public start(): void {
    if (this.animationId !== null) return;
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    this.animationId = requestAnimationFrame(render);
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clear();
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private draw(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerY = height / 2;

    this.ctx.fillStyle = 'rgba(10, 15, 20, 0.35)';
    this.ctx.fillRect(0, 0, width, height);

    let activeAnalyser: AnalyserNode | null = null;
    if (this.mode === 'listening') {
      activeAnalyser = this.recorderAnalyser;
    } else if (this.mode === 'speaking') {
      activeAnalyser = this.playerAnalyser;
    }

    if (!activeAnalyser || this.mode === 'idle') {
      const time = Date.now() * 0.003;
      const glowColor = this.personaTheme === 'eva' ? 'rgba(0, 240, 255, 0.4)' : 'rgba(0, 255, 136, 0.4)';

      this.ctx.beginPath();
      this.ctx.strokeStyle = glowColor;
      this.ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 4) {
        const y = centerY + Math.sin(x * 0.05 + time) * 3;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
      return;
    }

    const bufferLength = activeAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    activeAnalyser.getByteFrequencyData(dataArray);

    const barCount = 32;
    const barWidth = width / barCount - 2;
    const step = Math.floor(bufferLength / barCount);

    const primaryColor =
      this.mode === 'listening'
        ? 'rgba(0, 240, 255, 0.85)'
        : this.personaTheme === 'eva'
          ? 'rgba(255, 0, 128, 0.85)'
          : 'rgba(0, 255, 136, 0.85)';

    const secondaryGlow =
      this.mode === 'listening'
        ? 'rgba(0, 240, 255, 0.3)'
        : this.personaTheme === 'eva'
          ? 'rgba(255, 0, 128, 0.3)'
          : 'rgba(0, 255, 136, 0.3)';

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (height * 0.85));

      const x = i * (barWidth + 2);
      const y = centerY - barHeight / 2;

      this.ctx.fillStyle = secondaryGlow;
      this.ctx.fillRect(x - 1, y - 2, barWidth + 2, barHeight + 4);

      this.ctx.fillStyle = primaryColor;
      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }
}
