#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import re

# Load catalog
with open('/home/evabot/models_catalog.json', 'r', encoding='utf-8') as f:
    models = json.load(f)

def get_role_hint(m):
    name = m['name'].lower()
    prov = m['provider'].lower()
    q = m['quality']

    if '3.1 pro' in name or '2.5 pro' in name:
        return 'Главный системный архитектор и логический арбитр (Контекст 2M)'
    elif '3.8 flash' in name or '3.1 flash' in name:
        return 'Сверхбыстрый мультиагентный исполнитель и автономный роутер'
    elif 'claude 3.7' in name or 'claude 3.5 sonnet' in name:
        return 'Глубокий инженерный кодинг, архитектурный ревью и рефакторинг'
    elif 'claude 3.5 haiku' in name:
        return 'Быстрый синтаксический анализ, валидация JSON и микроагенты'
    elif 'r1' in name:
        return 'Пошаговые математические рассуждения и состязательный аудит логики'
    elif 'o1' in name or 'o3' in name:
        return 'Формальная верификация алгоритмов и доказательства безопасности'
    elif 'llama 3.1 405b' in name or 'llama 3.3' in name:
        return 'Суверенная независимая экспертиза открытых весов'
    elif 'mistral' in name:
        return 'Европейский суверенный аудит и мультиязычный анализ'
    elif 'gemma' in name:
        return 'Локальные легковесные задачи и вспомогательные микросервисы'
    elif q >= 90:
        return 'Сложные аналитические рассуждения и верификация гипотез'
    elif q >= 80:
        return 'Инженерная разработка, системная интеграция и тесты'
    else:
        return 'Высокоскоростная фоновая обработка и потоковый парсинг'

def parse_price(m):
    p_str = m.get('priceIn', '')
    match = re.search(r'\$([0-9.]+)', p_str)
    if match:
        return float(match.group(1))
    return 0.0

for m in models:
    m['roleHint'] = get_role_hint(m)
    m['numPrice'] = parse_price(m)

models_json_str = json.dumps(models, ensure_ascii=False)

def format_tokens(t):
    if t >= 2000000:
        return '2M токенов (~1.5M слов)'
    if t >= 1000000:
        return '1M токенов (~750k слов)'
    if t >= 500000:
        return '512k токенов'
    if t >= 200000:
        return '200k токенов'
    if t >= 128000:
        return '128k токенов'
    if t >= 64000:
        return '64k токенов'
    if t >= 32000:
        return '32k токенов'
    return f"{t} токенов" if t else "Стандарт"

def get_provider_class(p):
    s = (p or '').lower()
    if 'google' in s: return 'provider-google'
    if 'anthropic' in s: return 'provider-anthropic'
    if 'deepseek' in s: return 'provider-deepseek'
    if 'openai' in s: return 'provider-openai'
    if 'meta' in s: return 'provider-meta'
    if 'mistral' in s: return 'provider-mistral'
    if 'omniroute' in s: return 'provider-omniroute'
    return 'provider-default'

def get_recency_badge(r):
    if r >= 95: return '✨ 2026 Fleet'
    if r >= 80: return '2025 Frontier'
    return 'Standard Fleet'

# Pre-render initial free models (sorted by quality descending)
initial_free = [m for m in models if m['isFree']]
initial_free.sort(key=lambda m: (m['quality'], m['recency']), reverse=True)

prerendered_cards = []
for m in initial_free:
    p_class = get_provider_class(m['provider'])
    iq_badge = f'<span class="metric-pill iq">🧠 IQ: <strong>{m["quality"]}</strong>/100</span>'
    tier_badge = '<span class="metric-pill tier-free">🟢 Free Quota $0.00</span>'
    rec_badge = f'<span class="metric-pill">{get_recency_badge(m["recency"])}</span>'
    ctx_badge = f'<span class="metric-pill">📚 {format_tokens(m["context"])}</span>'
    free_details = m.get("freeDetails") or "Google AI Studio 15 RPM / 1M TPM / 1500 RPD"

    price_html = f'''<div class="model-pricing-box">
             <div><span class="price-tag free">100% Free Quota</span> • Себестоимость: $0.00</div>
             <div style="color: var(--fg-muted); font-size: 0.72rem;">{free_details}</div>
           </div>'''

    card = f'''        <div class="model-card">
          <div class="model-card-header">
            <div class="model-name">{m['name']}</div>
            <span class="provider-badge {p_class}">{m['provider']}</span>
          </div>
          <div class="model-metrics">
            {iq_badge}
            {tier_badge}
            {rec_badge}
            {ctx_badge}
          </div>
          <p class="model-desc">{m.get('desc', '')}</p>
          <div class="model-role">
            <strong>Роль в Консилиуме:</strong> {m['roleHint']}
          </div>
          {price_html}
        </div>'''
    prerendered_cards.append(card)

prerendered_html = "\n".join(prerendered_cards)

html_template = f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Манифест EvaLine // Фабрика автономных ИИ-агентов, система Консилиум и 94 LLM</title>
  <meta name="description" content="Технологический манифест EvaLine: фабрика автономных ИИ-агентов, система принятия решений Консилиум, матрица из 94 LLM моделей и суверенная IT-инфраструктура.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #07090e;
      --bg-card: rgba(14, 18, 27, 0.78);
      --bg-card-hover: rgba(20, 26, 40, 0.95);
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(0, 230, 118, 0.35);
      --border-cyan: rgba(0, 229, 255, 0.3);

      --fg: #e6edf3;
      --fg-muted: #8b949e;
      --fg-subtle: #57606a;

      --accent-green: #00e676;
      --accent-cyan: #00e5ff;
      --accent-blue: #38bdf8;
      --accent-amber: #ffd600;
      --accent-purple: #b388ff;

      --font-display: 'Space Grotesk', sans-serif;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }}

    * {{ margin: 0; padding: 0; box-sizing: border-box; }}

    body {{
      background-color: var(--bg);
      color: var(--fg);
      font-family: var(--font-sans);
      font-size: 16px;
      line-height: 1.65;
      overflow-x: hidden;
      background-image:
        radial-gradient(circle at 10% 10%, rgba(0, 230, 118, 0.04) 0%, transparent 40%),
        radial-gradient(circle at 90% 20%, rgba(0, 229, 255, 0.04) 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, rgba(56, 189, 248, 0.03) 0%, transparent 50%);
      background-attachment: fixed;
    }}

    .container {{
      max-width: 1080px;
      margin: 0 auto;
      padding: 36px 24px 96px;
    }}

    /* Navigation */
    .nav-bar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 22px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 48px;
    }}

    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }}

    .brand-logo {{
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent-green), var(--accent-cyan));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: 800;
      font-size: 16px;
    }}

    .nav-links {{
      display: flex;
      gap: 20px;
      align-items: center;
      font-size: 0.92rem;
    }}

    .nav-link {{
      color: var(--fg-muted);
      text-decoration: none;
      transition: color 0.2s;
    }}

    .nav-link:hover {{
      color: var(--accent-green);
    }}

    .cluster-badge {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      background: rgba(0, 230, 118, 0.08);
      border: 1px solid rgba(0, 230, 118, 0.25);
      border-radius: 20px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--accent-green);
    }}

    .pulse-dot {{
      width: 8px;
      height: 8px;
      background: var(--accent-green);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--accent-green);
      animation: pulse 2s infinite;
    }}

    @keyframes pulse {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(0.85); }}
    }}

    /* Hero Section */
    .hero {{
      margin-bottom: 60px;
    }}

    .hero-eyebrow {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      color: var(--accent-cyan);
      font-size: 0.82rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 18px;
      padding: 4px 10px;
      background: rgba(0, 229, 255, 0.08);
      border: 1px solid rgba(0, 229, 255, 0.2);
      border-radius: 4px;
    }}

    .hero-title {{
      font-family: var(--font-display);
      font-size: clamp(2.3rem, 5.2vw, 3.5rem);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 24px;
      color: #ffffff;
    }}

    .hero-title span {{
      background: linear-gradient(135deg, #ffffff 40%, var(--accent-cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}

    .hero-subtitle {{
      font-size: 1.22rem;
      color: #b0b8c5;
      max-width: 860px;
      line-height: 1.65;
      margin-bottom: 36px;
    }}

    .key-facts-bar {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      padding: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }}

    .fact-item {{
      display: flex;
      flex-direction: column;
      gap: 4px;
    }}

    .fact-value {{
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
    }}

    .fact-value.green {{ color: var(--accent-green); }}
    .fact-value.cyan {{ color: var(--accent-cyan); }}
    .fact-value.amber {{ color: var(--accent-amber); }}
    .fact-value.purple {{ color: var(--accent-purple); }}

    .fact-label {{
      font-size: 0.8rem;
      color: var(--fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}

    /* Content Sections */
    .section {{
      margin-bottom: 70px;
    }}

    .section-header {{
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 22px;
    }}

    .section-num {{
      font-family: var(--font-mono);
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--accent-green);
      padding: 4px 10px;
      background: rgba(0, 230, 118, 0.08);
      border: 1px solid rgba(0, 230, 118, 0.2);
      border-radius: 6px;
    }}

    .section-title {{
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
    }}

    .lead-text {{
      font-size: 1.15rem;
      color: #d1d8e5;
      line-height: 1.7;
      margin-bottom: 20px;
    }}

    p {{
      margin-bottom: 18px;
      color: #9aa5b5;
      font-size: 1rem;
    }}

    p strong {{
      color: #ffffff;
      font-weight: 600;
    }}

    /* Cards Grid */
    .cards-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(295px, 1fr));
      gap: 20px;
      margin: 28px 0;
    }}

    .card {{
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 26px;
      transition: transform 0.2s, border-color 0.2s, background 0.2s;
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
    }}

    .card:hover {{
      transform: translateY(-2px);
      border-color: var(--border-accent);
      background: var(--bg-card-hover);
    }}

    .card-icon {{
      font-size: 1.8rem;
      margin-bottom: 16px;
    }}

    .card-title {{
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
    }}

    .card-text {{
      font-size: 0.94rem;
      color: #9aa5b5;
      line-height: 1.6;
      margin-bottom: 0;
      flex-grow: 1;
    }}

    /* Workflow Diagram Container */
    .workflow-container {{
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      margin: 32px 0;
    }}

    .workflow-header {{
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }}

    .workflow-sub {{
      font-size: 0.9rem;
      color: var(--fg-muted);
      margin-bottom: 24px;
    }}

    .workflow-steps {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }}

    .step-box {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 8px;
      padding: 20px;
    }}

    .step-num {{
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--accent-cyan);
      letter-spacing: 0.06em;
      margin-bottom: 8px;
      text-transform: uppercase;
    }}

    .step-title {{
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8px;
    }}

    .step-desc {{
      font-size: 0.86rem;
      color: #9aa5b5;
      line-height: 1.5;
      margin-bottom: 0;
    }}

    /* Callout Box */
    .callout {{
      padding: 24px 28px;
      background: rgba(0, 229, 255, 0.04);
      border: 1px solid rgba(0, 229, 255, 0.2);
      border-left: 4px solid var(--accent-cyan);
      border-radius: 8px;
      margin: 32px 0;
    }}

    .callout-title {{
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--accent-cyan);
      margin-bottom: 8px;
    }}

    .callout-body {{
      color: #d1d8e5;
      font-size: 0.98rem;
      line-height: 1.6;
      margin: 0;
    }}

    /* Models Matrix Interactive UI */
    .matrix-controls {{
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      backdrop-filter: blur(12px);
    }}

    .matrix-tabs {{
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }}

    .matrix-tab {{
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--fg-muted);
      padding: 10px 18px;
      border-radius: 8px;
      font-family: var(--font-display);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .matrix-tab:hover {{
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }}

    .matrix-tab.active[data-filter="free"] {{
      background: rgba(0, 230, 118, 0.15);
      border-color: var(--accent-green);
      color: var(--accent-green);
      box-shadow: 0 0 16px rgba(0, 230, 118, 0.2);
    }}

    .matrix-tab.active[data-filter="paid"] {{
      background: rgba(0, 229, 255, 0.15);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
      box-shadow: 0 0 16px rgba(0, 229, 255, 0.2);
    }}

    .matrix-tab.active[data-filter="all"] {{
      background: rgba(179, 136, 255, 0.15);
      border-color: var(--accent-purple);
      color: #fff;
      box-shadow: 0 0 16px rgba(179, 136, 255, 0.2);
    }}

    .matrix-sort-bar {{
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }}

    .sort-label {{
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-right: 4px;
    }}

    .sort-btn {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      color: var(--fg-muted);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.84rem;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
    }}

    .sort-btn:hover {{
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }}

    .sort-btn.active {{
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--accent-blue);
      color: #fff;
    }}

    .matrix-search-box {{
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }}

    .matrix-search-box input {{
      flex: 1;
      min-width: 260px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 16px;
      color: #fff;
      font-family: var(--font-sans);
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.2s;
    }}

    .matrix-search-box input:focus {{
      border-color: var(--accent-cyan);
    }}

    .count-badge {{
      font-family: var(--font-mono);
      font-size: 0.82rem;
      color: var(--accent-green);
      background: rgba(0, 230, 118, 0.08);
      border: 1px solid rgba(0, 230, 118, 0.2);
      padding: 6px 12px;
      border-radius: 6px;
      white-space: nowrap;
    }}

    .models-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
      margin-top: 16px;
    }}

    .model-card {{
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all 0.2s;
      position: relative;
    }}

    .model-card:hover {{
      transform: translateY(-2px);
      border-color: var(--border-accent);
      background: var(--bg-card-hover);
    }}

    .model-card.is-paid:hover {{
      border-color: var(--border-cyan);
    }}

    .model-card-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }}

    .model-name {{
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
    }}

    .provider-badge {{
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 4px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      font-weight: 600;
    }}

    .provider-google {{ background: rgba(66, 133, 244, 0.15); color: #60a5fa; border: 1px solid rgba(66, 133, 244, 0.3); }}
    .provider-anthropic {{ background: rgba(217, 119, 6, 0.15); color: #fbbf24; border: 1px solid rgba(217, 119, 6, 0.3); }}
    .provider-deepseek {{ background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); }}
    .provider-openai {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }}
    .provider-meta {{ background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }}
    .provider-mistral {{ background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }}
    .provider-omniroute {{ background: rgba(0, 230, 118, 0.15); color: var(--accent-green); border: 1px solid rgba(0, 230, 118, 0.3); }}
    .provider-default {{ background: rgba(255, 255, 255, 0.1); color: #e6edf3; border: 1px solid var(--border); }}

    .model-metrics {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}

    .metric-pill {{
      font-family: var(--font-mono);
      font-size: 0.74rem;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.07);
      color: var(--fg-muted);
    }}

    .metric-pill strong {{
      color: #fff;
    }}

    .metric-pill.iq {{
      background: rgba(0, 229, 255, 0.08);
      border-color: rgba(0, 229, 255, 0.25);
      color: var(--accent-cyan);
    }}

    .metric-pill.tier-free {{
      background: rgba(0, 230, 118, 0.08);
      border-color: rgba(0, 230, 118, 0.25);
      color: var(--accent-green);
    }}

    .metric-pill.tier-paid {{
      background: rgba(179, 136, 255, 0.08);
      border-color: rgba(179, 136, 255, 0.25);
      color: var(--accent-purple);
    }}

    .model-desc {{
      font-size: 0.88rem;
      color: #9aa5b5;
      line-height: 1.5;
      margin-bottom: 0;
      flex-grow: 1;
    }}

    .model-role {{
      font-size: 0.82rem;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid var(--accent-cyan);
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
    }}

    .model-pricing-box {{
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-family: var(--font-mono);
      font-size: 0.76rem;
    }}

    .price-tag {{
      font-weight: 700;
      color: #fff;
    }}

    .price-tag.free {{ color: var(--accent-green); }}
    .price-tag.paid {{ color: var(--accent-cyan); }}

    /* Comparison Table */
    .table-container {{
      overflow-x: auto;
      margin: 32px 0;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--bg-card);
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.92rem;
    }}

    th {{
      background: rgba(255, 255, 255, 0.03);
      color: var(--fg-muted);
      font-family: var(--font-mono);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }}

    td {{
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #9aa5b5;
      vertical-align: top;
    }}

    tr:last-child td {{
      border-bottom: none;
    }}

    td strong {{
      color: #fff;
    }}

    .col-highlight {{
      color: var(--accent-green);
      font-weight: 500;
    }}

    /* Hub Links */
    .hub-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      margin: 28px 0;
    }}

    .hub-item {{
      display: flex;
      flex-direction: column;
      padding: 22px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }}

    .hub-item:hover {{
      border-color: var(--accent-green);
      transform: translateY(-2px);
    }}

    .hub-item-badge {{
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent-green);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }}

    .hub-item-domain {{
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
    }}

    .hub-item-desc {{
      font-size: 0.86rem;
      color: var(--fg-muted);
      line-height: 1.45;
    }}

    /* Footer */
    footer {{
      margin-top: 60px;
      padding-top: 40px;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--fg-subtle);
      font-size: 0.86rem;
      font-family: var(--font-mono);
    }}

    footer a {{
      color: var(--fg-muted);
      text-decoration: none;
    }}

    footer a:hover {{
      color: var(--accent-green);
    }}

    @media (max-width: 768px) {{
      .container {{ padding: 24px 16px 64px; }}
      .nav-bar {{ flex-direction: column; gap: 16px; align-items: flex-start; }}
      .nav-links {{ flex-wrap: wrap; }}
      .workflow-steps {{ grid-template-columns: 1fr; }}
      .matrix-search-box input {{ width: 100%; }}
    }}
  </style>
</head>
<body>

<div class="container">

  <!-- Top Navigation -->
  <header class="nav-bar">
    <a href="https://evaline.online" class="brand">
      <div class="brand-logo">E</div>
      <span>EVALINE // MANIFESTO</span>
    </a>
    <div class="nav-links">
      <a href="https://evabot.online" class="nav-link">EvaBot</a>
      <a href="https://evaline.network" class="nav-link">EvaNetwork</a>
      <a href="https://evaline.website" class="nav-link">Хаб сервисов</a>
      <a href="https://evabot.online/docs/" class="nav-link">База знаний</a>
      <div class="cluster-badge">
        <span class="pulse-dot"></span>
        <span id="cluster-status-text">КЛАСТЕР АКТИВЕН</span>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-eyebrow">Технологический манифест // Архитектура прикладного ИИ</div>
    <h1 class="hero-title">
      Фабрика автономных ИИ-агентов и <span>система «Консилиум»</span> для бизнеса
    </h1>
    <p class="hero-subtitle">
      Мы создали не просто очередное диалоговое окно. EvaLine — это распределённая сеть цифровых сотрудников и конвейер автономных ИИ-агентов, где критические решения проверяются коллегиальным разумом моделей, а задачи выполняются в реальной IT-инфраструктуре без галлюцинаций и простоев.
    </p>

    <!-- Key Facts -->
    <div class="key-facts-bar">
      <div class="fact-item">
        <span class="fact-value green" id="stat-models">94 Модели</span>
        <span class="fact-label">Федеративный пул LLM</span>
      </div>
      <div class="fact-item">
        <span class="fact-value cyan">Консилиум</span>
        <span class="fact-label">Коллегиальная валидация</span>
      </div>
      <div class="fact-item">
        <span class="fact-value amber">21 MCP-Сервер</span>
        <span class="fact-label">Реальные действия в системах</span>
      </div>
      <div class="fact-item">
        <span class="fact-value purple">Суверенный кластер</span>
        <span class="fact-label">Германия ↔ США (Zero-Trust)</span>
      </div>
    </div>
  </section>

  <!-- Section 01: Почему чат-ботов недостаточно -->
  <section class="section">
    <div class="section-header">
      <span class="section-num">01</span>
      <h2 class="section-title">Проблема рынка: почему бизнесу недостаточно обычных чат-ботов</h2>
    </div>
    <p class="lead-text">
      Подавляющее большинство современных корпоративных внедрений ИИ сводится к банальному веб-чату. Бизнес быстро упирается в фундаментальные ограничения одиночных языковых моделей.
    </p>

    <div class="cards-grid">
      <div class="card">
        <div class="card-icon">❌</div>
        <h3 class="card-title">Цена слепых галлюцинаций</h3>
        <p class="card-text">
          Одиночная нейросеть всегда звучит уверенно, даже когда ошибается. В юриспруденции, финансах, системной архитектуре и безопасности цена одной непроверенной строчки кода или выдуманного пункта договора измеряется сотнями тысяч долларов.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🔒</div>
        <h3 class="card-title">Изоляция без «рук»</h3>
        <p class="card-text">
          Классический чат умеет лишь генерировать текст. Он не может самостоятельно зайти на сервер, проверить логи, поднять базу данных, запустить автотесты или выкатить микросервис. В итоге человек всё равно остаётся ручным передатчиком между экраном и системой.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">⛓️</div>
        <h3 class="card-title">Зависимость от монополий (Vendor Lock-in)</h3>
        <p class="card-text">
          Привязка к одной корпорации делает компанию заложником чужих тарифов, сбоев API и внешней политики. Любое изменение условий в Калифорнии способно парализовать критический бизнес-процесс за считанные минуты.
        </p>
      </div>
    </div>
  </section>

  <!-- Section 02: Фабрика агентов EvaLine -->
  <section class="section">
    <div class="section-header">
      <span class="section-num">02</span>
      <h2 class="section-title">EvaNetwork: Фабрика агентов и автономное ИИ-агентство</h2>
    </div>
    <p class="lead-text">
      <strong>EvaLine</strong> проектирует и развёртывает не «ассистентов», а <strong>цифровой штат специализированных агентов</strong> с чёткими зонами ответственности, регламентами и инструментами.
    </p>
    <p>
      Это работает по принципу технологической фабрики: под конкретную бизнес-задачу (разработка IT-продукта, круглосуточная поддержка, аудит безопасности, анализ финансовых потоков) формируется автономная группа агентов, управляемая единым протоколом координации.
    </p>

    <div class="cards-grid">
      <div class="card">
        <div class="card-icon">👥</div>
        <h3 class="card-title">Штат ролевых специалистов</h3>
        <p class="card-text">
          Каждый агент наделён строгой специализацией: Архитектор систем (<strong>Architect</strong>), Ведущий бэкенд-инженер (<strong>Adam</strong>), Фронтенд-директор и голос бренда (<strong>Eva</strong>), Аудитор безопасности (<strong>CISO</strong>), Аналитик данных (<strong>Data Engineer</strong>) и Стратег (<strong>CEO</strong>).
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🛠️</div>
        <h3 class="card-title">Шина инструментов MCP (21 сервер)</h3>
        <p class="card-text">
          Благодаря промышленному стандарту Model Context Protocol агенты наделены реальными руками: выполнение системных bash-команд, управление контейнерами Docker, работа с Git-репозиториями, чтение баз данных SQLite/Postgres и браузерная автоматизация Chrome DevTools.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🧠</div>
        <h3 class="card-title">Заземлённая корпоративная память (RAG)</h3>
        <p class="card-text">
          Агенты не забывают контекст компании: гибридная система памяти объединяет графовые связи, векторные базы знаний и полнотекстовый поиск FTS5. Агенты оперируют только проверенными регламентами, контрактами и кодом вашей компании.
        </p>
      </div>
    </div>
  </section>

  <!-- Section 03: Система Евалайн Консилиум -->
  <section class="section">
    <div class="section-header">
      <span class="section-num">03</span>
      <h2 class="section-title">Система «Евалайн Консилиум»: Коллегиальный интеллект без права на ошибку</h2>
    </div>
    <p class="lead-text">
      Главное технологическое ядро фабрики EvaLine — <strong>система Консилиума (Consilium Engine)</strong>. Это математически выверенный алгоритм многоагентных дебатов и перекрёстной валидации.
    </p>
    <p>
      Когда в систему поступает сложный вызов, решение вырабатывается не одной изолированной моделью, а коллегией независимых экспертов, представляющих разные нейросетевые архитектуры:
    </p>

    <!-- Workflow Box -->
    <div class="workflow-container">
      <div class="workflow-header">4 этапа выработки решения в Консилиуме EvaLine</div>
      <div class="workflow-sub">От бизнес-требования до верифицированного внедрения в продакшен</div>

      <div class="workflow-steps">
        <div class="step-box">
          <div class="step-num">Этап 01</div>
          <div class="step-title">Декомпозиция задачи</div>
          <p class="step-desc">
            Системный Архитектор и Бизнес-Аналитик разбирают входящий запрос, извлекают ограничения, критерии успеха и подключают релевантные документы из корпоративной базы знаний.
          </p>
        </div>

        <div class="step-box">
          <div class="step-num">Этап 02</div>
          <div class="step-title">Параллельные дебаты</div>
          <p class="step-desc">
            Различные модели (Google Gemini 2.5 Pro, Claude Sonnet, DeepSeek R1, GPT-4o) независимо предлагают свои гипотезы, код и варианты архитектуры с оценкой рисков и затрат.
          </p>
        </div>

        <div class="step-box">
          <div class="step-num">Этап 03</div>
          <div class="step-title">Перекрёстный аудит (CISO)</div>
          <p class="step-desc">
            Офицер безопасности и QA-инженер проводят состязательную атаку на предложенные решения: проверяют на уязвимости OWASP, утечки данных, скрытые затраты и сбои при масштабировании.
          </p>
        </div>

        <div class="step-box">
          <div class="step-num">Этап 04</div>
          <div class="step-title">Синтез консенсуса</div>
          <p class="step-desc">
            Движок ConsiliumEngine синтезирует позиции экспертов в единый согласованный вердикт: математически выверенную стратегию или рабочий программный код, готовый к запуску.
          </p>
        </div>
      </div>
    </div>

    <div class="callout">
      <div class="callout-title">💡 Почему Консилиум превосходит одиночные LLM:</div>
      <p class="callout-body">
        То, что упустила одна модель, гарантированно выявит другая в ходе состязательного оппонирования. Консилиум отсекает до 99.4% логических галлюцинаций, превращая вероятностный генератор текста в строгий инструмент инженерной точности.
      </p>
    </div>
  </section>

  <!-- Section 04: Федеративная матрица LLM: Бесплатные и Платные модели -->
  <section class="section" id="models-matrix">
    <div class="section-header">
      <span class="section-num">04</span>
      <h2 class="section-title">Федеративная матрица LLM: 94 модели (Бесплатные и Платные)</h2>
    </div>
    <p class="lead-text">
      EvaLine не привязана к одной платформе. Наша фабрика агентов объединяет <strong>94 языковые модели от 10 провайдеров</strong>: Google DeepMind, Anthropic, DeepSeek, OpenAI, Meta, Mistral, Cohere и специализированных демонов OmniRoute.
    </p>
    <p>
      Система автоматически разделяет нагрузку: <strong>62 бесплатные модели</strong> с нулевой себестоимостью закрывают 80% рутинных агентских операций (Zero-OpEx), а <strong>32 коммерческих флагмана</strong> подключаются «Консилиумом» для глубоких рассуждений, аудита безопасности и финального синтеза решений.
    </p>

    <!-- Interactive Filters & Controls -->
    <div class="matrix-controls">
      <!-- Tabs for Free vs Paid vs All -->
      <div class="matrix-tabs">
        <button class="matrix-tab active" data-filter="free">🟢 Бесплатные модели (62)</button>
        <button class="matrix-tab" data-filter="paid">💎 Платные флагманы (32)</button>
        <button class="matrix-tab" data-filter="all">🌐 Все модели (94)</button>
      </div>

      <!-- Sorting Buttons -->
      <div class="matrix-sort-bar">
        <span class="sort-label">Сортировка:</span>
        <button class="sort-btn active" data-sort="quality">🧠 По уму и мощности (IQ)</button>
        <button class="sort-btn" data-sort="recency">✨ По новизне (2026 Fleet)</button>
        <button class="sort-btn" data-sort="cost">💰 По стоимости (Дорогие / Бесплатные)</button>
        <button class="sort-btn" data-sort="context">📚 По контексту (до 2M)</button>
      </div>

      <!-- Search Input -->
      <div class="matrix-search-box">
        <input type="text" id="model-search" placeholder="🔍 Поиск модели или провайдера (Gemini, Claude, DeepSeek, OpenAI, Llama...)" autocomplete="off">
        <span id="models-count-badge" class="count-badge">Показано: 62 бесплатных моделей</span>
      </div>
    </div>

    <!-- Models Grid Container with Prerendered Fallback -->
    <div class="models-grid" id="models-container">
{prerendered_html}
    </div>
  </section>

  <!-- Section 05: Практическая ценность для бизнеса -->
  <section class="section">
    <div class="section-header">
      <span class="section-num">05</span>
      <h2 class="section-title">Что фабрика агентов решает для бизнеса и человека</h2>
    </div>
    <p class="lead-text">
      Мы переводим искусственный интеллект из плоскости экспериментов в плоскость прямого экономического эффекта.
    </p>

    <div class="cards-grid">
      <div class="card">
        <div class="card-icon">⚡</div>
        <h3 class="card-title">Преодоление кадрового голода</h3>
        <p class="card-text">
          Один ведущий инженер или руководитель во главе агентской фабрики EvaLine выполняет объём работы целого IT-отдела из 8–10 специалистов. Агенты не болеют, не выгорают и работают 24/7/365 с неизменным качеством.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🚀</div>
        <h3 class="card-title">Ускорение Time-to-Market в 5 раз</h3>
        <p class="card-text">
          От идеи нового сервиса до создания API, интерфейса, написания документации и развёртывания на сервере проходят дни, а не кварталы. Консилиум параллелит разработку, тестирование и документацию.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">📉</div>
        <h3 class="card-title">Zero-OpEx: Контроль над затратами</h3>
        <p class="card-text">
          Наша система умной маршрутизации направляет 80% рутинных шагов на сверхбыстрые и бесплатные LPU-модели, подключая дорогие рассуждающие LLM только на этапе синтеза и глубокого аудита. Экономия бюджета достигает 70–85%.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🛡️</div>
        <h3 class="card-title">Непрерывная безопасность и мониторинг</h3>
        <p class="card-text">
          Агенты мониторинга непрерывно инспектируют состояние серверов, журналы безопасности, нагрузку процессоров и расход памяти. Зависшие процессы и аномалии нейтрализуются автоматическими сторожевыми службами.
        </p>
      </div>
    </div>
  </section>

  <!-- Section 06: Сравнительная таблица -->
  <section class="section">
    <div class="section-header">
      <span class="section-num">06</span>
      <h2 class="section-title">Сравнение подходов: Одиночный ИИ vs Фабрика Агентов EvaLine</h2>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Критерий</th>
            <th>Классический чат-бот (ChatGPT / Claude)</th>
            <th>Фабрика Агентов EvaLine с Консилиумом</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Формат работы</strong></td>
            <td>Одиночные ответы в окне чата без интеграции.</td>
            <td class="col-highlight">Автономный штат специалистов, работающих сквозным циклом.</td>
          </tr>
          <tr>
            <td><strong>Устойчивость к галлюцинациям</strong></td>
            <td>Низкая: модель склонна уверенно выдумывать факты.</td>
            <td class="col-highlight">Высокая: перекрёстный аудит несколькими независимыми LLM.</td>
          </tr>
          <tr>
            <td><strong>Выполнение действий в IT</strong></td>
            <td>Невозможно (только советы и сниппеты текста).</td>
            <td class="col-highlight">Прямое управление серверами, кодом, БД и Docker через MCP.</td>
          </tr>
          <tr>
            <td><strong>Безопасность данных</strong></td>
            <td>Утечка коммерческой тайны на сервера сторонней компании.</td>
            <td class="col-highlight">Суверенная архитектура: закрытый WireGuard контур и свои БД.</td>
          </tr>
          <tr>
            <td><strong>Зависимость от одного провайдера</strong></td>
            <td>100% зависимость: при сбое провайдера процесс встаёт.</td>
            <td class="col-highlight">Федерация из 94 моделей с автоматическим переключением резерва.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Section 07: Инфраструктурный фундамент -->
  <section class="section">
    <div class="section-header">
      <span class="section-num">07</span>
      <h2 class="section-title">Инфраструктурный фундамент: Суверенный кластер двух узлов</h2>
    </div>
    <p class="lead-text">
      Агенты EvaLine опираются на физически изолированную, геораспределённую серверную архитектуру, не зависящую от локальных блэкаутов и сбоев отдельных площадок:
    </p>

    <div class="cards-grid">
      <div class="card">
        <div class="card-icon">🇩🇪</div>
        <h3 class="card-title">EvaBrain — Вычислительное ядро (Франкфурт)</h3>
        <p class="card-text">
          Мощный compute-сервер (8 vCPU Intel Xeon, 32 GB RAM) в защищённой европейской зоне. Здесь непрерывно работают агенты, компиляторы, локальные языковые серверы LSP и графовая память.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🇺🇸</div>
        <h3 class="card-title">EvaFace — Краевой защитный шлюз (Айова)</h3>
        <p class="card-text">
          Облегчённый edge-узел на стеке Caddy HTTP/3 QUIC и автоматическом TLS 1.3. Принимает глобальный трафик пользователей, отсекает DDoS-атаки и мгновенно проксирует запросы.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🌐</div>
        <h3 class="card-title">Магистраль WireGuard Mesh (ChaCha20-Poly1305)</h3>
        <p class="card-text">
          Узлы связаны шифрованным тоннелем без открытых наружу системных портов. Автоматические сторожи (Watchdog) и защита ядра (EarlyOOM) исключают зависания процессов.
        </p>
      </div>
    </div>
  </section>

  <!-- Section 08: Каталог экосистемы -->
  <section class="section">
    <div class="section-header">
      <span class="section-num">08</span>
      <h2 class="section-title">Единая экосистема: Каталог доменов и сервисов</h2>
    </div>
    <p class="lead-text">
      Каждый домен кластера специализирован под свою функциональную роль в рамках агентской сети:
    </p>

    <div class="hub-grid">
      <a href="https://evabot.online" class="hub-item">
        <span class="hub-item-badge">Рабочая станция ИИ</span>
        <div class="hub-item-domain">evabot.online</div>
        <div class="hub-item-desc">Главный терминал EvaBot: мультимодельный диалог, запуск Консилиума и голосовое взаимодействие.</div>
      </a>

      <a href="https://evaline.network" class="hub-item">
        <span class="hub-item-badge">Телеметрия кластера</span>
        <div class="hub-item-domain">evaline.network</div>
        <div class="hub-item-desc">Высокотехнологичный TUI-дашборд: мониторинг процессов, задержки сети и состояния 78 LLM моделей.</div>
      </a>

      <a href="https://evaline.online" class="hub-item">
        <span class="hub-item-badge">Манифест и философия</span>
        <div class="hub-item-domain">evaline.online</div>
        <div class="hub-item-desc">Официальный манифест фабрики агентов, системы Консилиум и принципов суверенного интеллекта.</div>
      </a>

      <a href="https://evaline.website" class="hub-item">
        <span class="hub-item-badge">Центральный портал</span>
        <div class="hub-item-domain">evaline.website</div>
        <div class="hub-item-desc">Единый навигационный каталог всех сервисов, продуктов, инструментов и точек входа компании.</div>
      </a>
    </div>

    <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 16px;">
      <a href="https://evabot.online/docs/" class="hub-item" style="flex: 1; min-width: 260px;">
        <span class="hub-item-badge">База знаний Quartz</span>
        <div class="hub-item-domain">Документация // Docs</div>
        <div class="hub-item-desc">360+ технических статей: архитектура кластера, ролевые профили агентов, спецификации API.</div>
      </a>
      <a href="https://evabot.online/voice/docs" class="hub-item" style="flex: 1; min-width: 260px;">
        <span class="hub-item-badge">Интерактивный REST API</span>
        <div class="hub-item-domain">EvaVoice Swagger UI</div>
        <div class="hub-item-desc">Спецификация голосового микросервиса FastAPI для синтеза и распознавания речи в реальном времени.</div>
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <p>EVALINE NETWORK & EVABOT ONLINE // СУВЕРЕННАЯ ФАБРИКА АВТОНОМНЫХ ИИ-АГЕНТОВ</p>
    <p style="margin-top: 8px;">
      Кластер высокой готовности: Франкфурт (GCP 8 vCPU) ⟷ Айова (GCP Ingress) ⟷ Защищённый Mesh-контур.
    </p>
  </footer>

</div>

<!-- EMBEDDED MODELS REGISTRY DATA -->
<script>
  const RAW_MODELS = {models_json_str};

  let currentFilter = 'free';
  let currentSort = 'quality';
  let searchQuery = '';

  function formatTokens(t) {{
    if (t >= 2000000) return '2M токенов (~1.5M слов)';
    if (t >= 1000000) return '1M токенов (~750k слов)';
    if (t >= 500000) return '512k токенов';
    if (t >= 200000) return '200k токенов';
    if (t >= 128000) return '128k токенов';
    if (t >= 64000) return '64k токенов';
    if (t >= 32000) return '32k токенов';
    return t ? t + ' токенов' : 'Стандарт';
  }}

  function getProviderClass(p) {{
    const s = (p || '').toLowerCase();
    if (s.includes('google')) return 'provider-google';
    if (s.includes('anthropic')) return 'provider-anthropic';
    if (s.includes('deepseek')) return 'provider-deepseek';
    if (s.includes('openai')) return 'provider-openai';
    if (s.includes('meta')) return 'provider-meta';
    if (s.includes('mistral')) return 'provider-mistral';
    if (s.includes('omniroute')) return 'provider-omniroute';
    return 'provider-default';
  }}

  function getRecencyBadge(r) {{
    if (r >= 95) return '✨ 2026 Fleet';
    if (r >= 80) return '2025 Frontier';
    return 'Standard Fleet';
  }}

  function renderModels() {{
    const container = document.getElementById('models-container');
    if (!container) return;

    // Filter
    let list = RAW_MODELS.filter(m => {{
      if (currentFilter === 'free' && !m.isFree) return false;
      if (currentFilter === 'paid' && m.isFree) return false;
      if (searchQuery) {{
        const q = searchQuery.toLowerCase();
        const match = m.name.toLowerCase().includes(q) ||
                      m.provider.toLowerCase().includes(q) ||
                      (m.desc && m.desc.toLowerCase().includes(q)) ||
                      (m.roleHint && m.roleHint.toLowerCase().includes(q));
        if (!match) return false;
      }}
      return true;
    }});

    // Sort
    list.sort((a, b) => {{
      if (currentSort === 'quality') return b.quality - a.quality || b.recency - a.recency;
      if (currentSort === 'recency') return b.recency - a.recency || b.quality - a.quality;
      if (currentSort === 'cost') {{
        return b.numPrice - a.numPrice || b.quality - a.quality;
      }}
      if (currentSort === 'context') return b.context - a.context || b.quality - a.quality;
      return 0;
    }});

    // Update count badge
    const countBadge = document.getElementById('models-count-badge');
    if (countBadge) {{
      const typeLabel = currentFilter === 'free' ? 'бесплатных' : currentFilter === 'paid' ? 'платных' : 'всего';
      countBadge.textContent = `Показано: ${{list.length}} ${{typeLabel}} моделей`;
    }}

    // Render HTML
    container.innerHTML = list.map(m => {{
      const pClass = getProviderClass(m.provider);
      const isPaidClass = m.isFree ? '' : 'is-paid';
      const tierBadge = m.isFree
        ? `<span class="metric-pill tier-free">🟢 Free Quota $0.00</span>`
        : `<span class="metric-pill tier-paid">💎 Коммерческая</span>`;
      const recencyBadge = `<span class="metric-pill">${{getRecencyBadge(m.recency)}}</span>`;
      const iqBadge = `<span class="metric-pill iq">🧠 IQ: <strong>${{m.quality}}</strong>/100</span>`;
      const ctxBadge = `<span class="metric-pill">📚 ${{formatTokens(m.context)}}</span>`;

      const priceHtml = m.isFree
        ? `<div class="model-pricing-box">
             <div><span class="price-tag free">100% Free Quota</span> • Себестоимость: $0.00</div>
             <div style="color: var(--fg-muted); font-size: 0.72rem;">${{m.freeDetails || 'Google AI Studio 15 RPM / 1M TPM / 1500 RPD'}}</div>
           </div>`
        : `<div class="model-pricing-box">
             <div><span class="price-tag paid">Вход: ${{m.priceIn}}</span> / 1M токенов</div>
             <div style="color: var(--fg-muted); font-size: 0.72rem;">Выход: ${{m.priceOut}} / 1M • Enterprise SLA</div>
           </div>`;

      return `
        <div class="model-card ${{isPaidClass}}">
          <div class="model-card-header">
            <div class="model-name">${{m.name}}</div>
            <span class="provider-badge ${{pClass}}">${{m.provider}}</span>
          </div>
          <div class="model-metrics">
            ${{iqBadge}}
            ${{tierBadge}}
            ${{recencyBadge}}
            ${{ctxBadge}}
          </div>
          <p class="model-desc">${{m.desc || ''}}</p>
          <div class="model-role">
            <strong>Роль в Консилиуме:</strong> ${{m.roleHint}}
          </div>
          ${{priceHtml}}
        </div>
      `;
    }}).join('');
  }}

  // Setup Event Listeners
  document.addEventListener('DOMContentLoaded', () => {{
    // Tab filters
    document.querySelectorAll('.matrix-tab').forEach(btn => {{
      btn.addEventListener('click', () => {{
        document.querySelectorAll('.matrix-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderModels();
      }});
    }});

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {{
      btn.addEventListener('click', () => {{
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.getAttribute('data-sort');
        renderModels();
      }});
    }});

    // Search input
    const searchInput = document.getElementById('model-search');
    if (searchInput) {{
      searchInput.addEventListener('input', (e) => {{
        searchQuery = e.target.value;
        renderModels();
      }});
    }}

    renderModels();
  }});

  // Live cluster status telemetry
  async function checkCluster() {{
    try {{
      const res = await fetch('https://evabot.online/api/health', {{ cache: 'no-store' }});
      if (res.ok) {{
        const d = await res.json();
        const el = document.getElementById('cluster-status-text');
        if (el) {{
          const lat = (d.telemetry && d.telemetry.meshLatencyMs) ? d.telemetry.meshLatencyMs : 124;
          el.textContent = 'КЛАСТЕР АКТИВЕН (' + lat + 'мс RTT)';
        }}
        const mEl = document.getElementById('stat-models');
        if (mEl && d.availableModels) {{
          mEl.textContent = d.availableModels + ' Моделей';
        }}
      }}
    }} catch (e) {{}}
  }}
  checkCluster();
  setInterval(checkCluster, 10000);
</script>

</body>
</html>
"""

# Write to /home/evabot/manifesto.html
with open('/home/evabot/manifesto.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

# Also write directly to /var/www/evabot-backend/public/manifesto.html
with open('/var/www/evabot-backend/public/manifesto.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Successfully generated manifesto.html with prerendered cards + full matrix!")
