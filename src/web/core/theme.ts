import type { SiteConfig } from './config.js';

/**
 * Theme engine: manages the terminal look & feel.
 * Default is NOCSS (pure terminal, structural <pre> text). Toggling to CSS mode
 * injects a minimal inline stylesheet that keeps the same linear layout but adds
 * colors, spacing and responsive grid behaviour.
 * This keeps every node independent: it never depends on external CDNs.
 */
export class Theme {
  enabled = false;

  /** Light/dark theme mode, persisted under `evabot-theme`. Default: dark. */
  theme: 'dark' | 'light' = 'dark';

  constructor(private cfg: SiteConfig) {
    const saved = localStorage.getItem('nocss');
    // NOCSS is the default (no saved value) — pure terminal experience.
    this.enabled = saved === null ? true : saved === '1';
    const savedTheme = localStorage.getItem('evabot-theme');
    this.theme = savedTheme === 'light' ? 'light' : 'dark';
    this.apply();
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('nocss', this.enabled ? '1' : '0');
    this.apply();
    return this.enabled;
  }

  /** Toggles light/dark theme, persists it to localStorage and re-applies CSS vars. */
  toggleTheme(): 'dark' | 'light' {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('evabot-theme', this.theme);
    this.apply();
    return this.theme;
  }

  /** CSS design tokens per theme, applied as variables on `:root`. */
  private palette(): Record<string, string> {
    const accent = this.cfg.accent || '#3fb950';
    if (this.theme === 'light') {
      return {
        '--bg-primary': '#f6f8fa',
        '--bg-secondary': '#ffffff',
        '--fg-primary': '#1f2328',
        '--fg-secondary': '#57606a',
        '--accent': accent,
        '--border': '#d0d7de',
        '--link': '#0969da',
        '--link-hover': '#0550ae',
        '--btn-bg': '#eff1f3',
        '--btn-hover-bg': '#dae0e6',
        '--btn-border': '#d0d7de',
        '--btn-active-bg': '#1a7f37',
        '--btn-active-border': '#2da44e',
        '--hr': '#d0d7de',
        '--spinner': '#0550ae',
        '--accent-glow': 'rgba(46,164,94,0.4)',
      };
    }
    return {
      '--bg-primary': '#0d1117',
      '--bg-secondary': '#161b22',
      '--fg-primary': '#c9d1d9',
      '--fg-secondary': '#8b949e',
      '--accent': accent,
      '--border': '#30363d',
      '--link': '#58a6ff',
      '--link-hover': '#79c0ff',
      '--btn-bg': '#21262d',
      '--btn-hover-bg': '#30363d',
      '--btn-border': '#30363d',
      '--btn-active-bg': '#238636',
      '--btn-active-border': '#2ea043',
      '--hr': '#30363d',
      '--spinner': '#58a6ff',
      '--accent-glow': 'rgba(63,185,80,0.5)',
    };
  }

  apply(): void {
    const style = document.getElementById('main-style') as HTMLStyleElement | null;
    if (style) {
      style.disabled = this.enabled; // disable <style> in NOCSS mode
    }
    // Theme design tokens on :root — applied independently of NOCSS mode.
    const root = document.documentElement;
    for (const [prop, value] of Object.entries(this.palette())) {
      root.style.setProperty(prop, value);
    }
    let css = document.getElementById('core-theme-style') as HTMLStyleElement | null;
    if (!this.enabled) {
      if (css) css.remove();
      return;
    }
    if (!css) {
      css = document.createElement('style');
      css.id = 'core-theme-style';
      document.head.appendChild(css);
    }
    css.textContent = `
      html{font-size:16px;}
      html,body{background:var(--bg-primary);color:var(--fg-primary);font-family:'Roboto',sans-serif;
        margin:0;padding:12px 20px;line-height:1.45;width:100%;max-width:100%;overflow-x:hidden;}
      a{color:var(--link);text-decoration:none;} a:hover{text-decoration:underline;color:var(--link-hover);}
      button{font-family:inherit;font-size:0.75rem;background:var(--btn-bg);color:var(--fg-primary);border:1px solid var(--btn-border);
        padding:5px 10px;cursor:pointer;border-radius:4px;}
      button:hover{background:var(--btn-hover-bg);color:var(--fg-primary);}
      button.active{background:var(--btn-active-bg);border-color:var(--btn-active-border);color:#fff;}
      .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;width:100%;}
      .live-dot{color:var(--accent);animation:pulse-dot 2s infinite ease-in-out;}
      @keyframes pulse-dot{0%,100%{opacity:1;text-shadow:0 0 4px var(--accent-glow);}50%{opacity:.3;text-shadow:none;}}
      .spinner{color:var(--spinner);}
      pre,code{font-family:'Roboto Mono','Roboto',monospace;}
      pre{white-space:pre-wrap;word-break:break-word;background:transparent;margin:0 0 10px 0;font-size:0.8125rem;width:100%;}
      hr{border:none;border-top:1px solid var(--hr);margin:12px 0;}
      .ok{color:var(--accent);font-weight:bold;}
      .dim{color:var(--fg-secondary);}
      @media(max-width:768px){.grid-2{grid-template-columns:1fr;}body{padding:8px 10px;font-size:0.75rem;}}
    `;
  }

  /** Returns the standard NOCSS toggle label based on state + language. */
  label(onText: string, offText: string): string {
    return this.enabled ? onText : offText;
  }
}
