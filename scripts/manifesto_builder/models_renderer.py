# -*- coding: utf-8 -*-
import json
import re
from helpers import t

with open('/home/evabot/models_catalog.json', 'r', encoding='utf-8') as f:
    raw_models = json.load(f)

def get_role_hints(m):
    name = m['name'].lower()
    q = m.get('quality', 50)
    if '3.1 pro' in name or '2.5 pro' in name:
        return {
            'ru': 'Главный системный архитектор и логический арбитр (Контекст 2M)',
            'uk': 'Головний системний архітектор та логічний арбітр (Контекст 2M)',
            'en': 'Lead System Architect & Logical Arbitrator (2M Context Window)'
        }
    elif '3.8 flash' in name or '3.1 flash' in name:
        return {
            'ru': 'Сверхбыстрый мультиагентный исполнитель и автономный роутер',
            'uk': 'Надшвидкий мультиагентний виконавець та автономний роутер',
            'en': 'Ultra-Fast Multi-Agent Executor & Autonomous Low-Latency Router'
        }
    elif 'claude 3.7' in name or 'claude 3.5 sonnet' in name:
        return {
            'ru': 'Глубокий инженерный кодинг, архитектурный ревью и рефакторинг',
            'uk': 'Глибокий інженерний кодинг, архітектурний рев\'ю та рефакторинг',
            'en': 'Deep Engineering Coding, Architecture Review & Refactoring'
        }
    elif 'claude 3.5 haiku' in name:
        return {
            'ru': 'Быстрый синтаксический анализ, валидация JSON и микроагенты',
            'uk': 'Швидкий синтаксичний аналіз, валідація JSON та мікроагенти',
            'en': 'Rapid Syntax Parsing, JSON Validation & Micro-Agents'
        }
    elif 'r1' in name:
        return {
            'ru': 'Пошаговые математические рассуждения и состязательный аудит логики',
            'uk': 'Покрокові математичні міркування та змагальний аудит логіки',
            'en': 'Step-by-Step Chain-of-Thought Math & Adversarial Logic Audit'
        }
    elif 'o1' in name or 'o3' in name:
        return {
            'ru': 'Формальная верификация алгоритмов и доказательства безопасности',
            'uk': 'Формальна верифікація алгоритмів та докази безпеки',
            'en': 'Formal Algorithm Verification & Provable Safety Checks'
        }
    elif 'llama 3.1 405b' in name or 'llama 3.3' in name:
        return {
            'ru': 'Суверенная независимая экспертиза открытых весов',
            'uk': 'Суверенна незалежна експертиза відкритих ваг',
            'en': 'Sovereign Open-Weights Independent Evaluation'
        }
    elif 'mistral' in name:
        return {
            'ru': 'Европейский суверенный аудит и мультиязычный анализ',
            'uk': 'Європейський суверенний аудит та багатомовний аналіз',
            'en': 'European Sovereign Audit & Multilingual Analysis'
        }
    elif 'gemma' in name:
        return {
            'ru': 'Локальные легковесные задачи и вспомогательные микросервисы',
            'uk': 'Локальні легковажні задачі та допоміжні мікросервіси',
            'en': 'Local Lightweight Inference & Ancillary Microservices'
        }
    elif q >= 90:
        return {
            'ru': 'Сложные аналитические рассуждения и верификация гипотез',
            'uk': 'Складні аналітичні міркування та верифікація гіпотез',
            'en': 'Complex Analytical Reasoning & Hypothesis Verification'
        }
    elif q >= 80:
        return {
            'ru': 'Инженерная разработка, системная интеграция и тесты',
            'uk': 'Інженерна розробка, системна інтеграція та тести',
            'en': 'Engineering Development, System Integration & Testing'
        }
    else:
        return {
            'ru': 'Высокоскоростная фоновая обработка и потоковый парсинг',
            'uk': 'Високошвидкісна фонова обробка та потоковий парсинг',
            'en': 'High-Throughput Background Processing & Stream Parsing'
        }

def parse_price(m):
    p_str = m.get('priceIn', '')
    match = re.search(r'\$([0-9.]+)', p_str)
    return float(match.group(1)) if match else 0.0

def format_tokens(t_val):
    if t_val >= 2000000:
        return t("2M токенов (~1.5M слов)", "2M токенів (~1.5M слів)", "2M tokens (~1.5M words)")
    if t_val >= 1000000:
        return t("1M токенов (~750k слов)", "1M токенів (~750k слів)", "1M tokens (~750k words)")
    if t_val >= 500000:
        return t("512k токенов", "512k токенів", "512k tokens")
    if t_val >= 200000:
        return t("200k токенов", "200k токенів", "200k tokens")
    if t_val >= 128000:
        return t("128k токенов", "128k токенів", "128k tokens")
    if t_val >= 64000:
        return t("64k токенов", "64k токенів", "64k tokens")
    if t_val >= 32000:
        return t("32k токенов", "32k токенів", "32k tokens")
    return t(f"{t_val} токенов" if t_val else "Стандарт",
             f"{t_val} токенів" if t_val else "Стандарт",
             f"{t_val} tokens" if t_val else "Standard")

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

for m in raw_models:
    m['roleHints'] = get_role_hints(m)
    m['roleHint'] = m['roleHints']['ru']
    m['numPrice'] = parse_price(m)

models_json_str = json.dumps(raw_models, ensure_ascii=False)

def get_prerendered_models():
    initial_free = [m for m in raw_models if m['isFree']]
    initial_free.sort(key=lambda m: (m.get('quality', 0), m.get('recency', 0)), reverse=True)

    cards = []
    for m in initial_free:
        p_class = get_provider_class(m['provider'])
        iq_badge = f'<span class="metric-pill iq">🧠 IQ: <strong>{m.get("quality", 0)}</strong>/100</span>'
        tier_badge = f'<span class="metric-pill tier-free">{t("🟢 Free Quota $0.00", "🟢 Free Quota $0.00", "🟢 Free Quota $0.00")}</span>'
        rec_badge = f'<span class="metric-pill">{get_recency_badge(m.get("recency", 0))}</span>'
        ctx_badge = f'<span class="metric-pill">📚 {format_tokens(m.get("context", 0))}</span>'
        free_details = m.get("freeDetails") or "Google AI Studio 15 RPM / 1M TPM / 1,500 RPD ($0.00)"

        price_html = f'''<div class="model-pricing-box">
          <div><span class="price-tag free">100% Free Quota</span> • {t("Себестоимость: $0.00", "Собівартість: $0.00", "Token Cost: $0.00")}</div>
          <div style="color: var(--fg-muted); font-size: 0.72rem;">{free_details}</div>
        </div>'''

        role_label = t("Роль в Консилиуме:", "Роль у Консиліумі:", "Role in Consilium:")
        role_text = t(m['roleHints']['ru'], m['roleHints']['uk'], m['roleHints']['en'])
        rel_date = m.get('releaseDate', '')
        upd_date = m.get('lastUpdate', '')
        dates_html = ''
        if rel_date or upd_date:
            dates_html = f'''<div class="model-dates">
              <span>🗓 {t("Релиз:", "Реліз:", "Released:")} <strong>{rel_date}</strong></span>
              <span>🔄 {t("Обновление:", "Оновлення:", "Updated:")} <strong>{upd_date}</strong></span>
            </div>'''

        c = f'''        <div class="model-card">
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
          {dates_html}
          <div class="model-role">
            <strong>{role_label}</strong> {role_text}
          </div>
          {price_html}
        </div>'''
        cards.append(c)
    return "\n".join(cards)


def _model_line(m, idx, with_dates=False):
    """One model + description = exactly one line (raw/terminal readable)."""
    dates = ''
    if with_dates:
        rel = m.get('releaseDate', '')
        upd = m.get('lastUpdate', '')
        if rel or upd:
            dates = f' <span class="ml-dates">🗓 {rel} → {upd}</span>'
    return (f'<div class="model-line">'
            f'<span class="ml-idx">{idx:02d}</span>'
            f'<span class="ml-name">{m.get("name", "")}</span>'
            f'<span class="ml-prov">{m.get("provider", "")}</span>'
            f'<span class="ml-iq">IQ {m.get("quality", 0)}</span>'
            f'<span class="ml-desc">{m.get("desc", "")}</span>'
            f'{dates}</div>')


def get_models_line_list(limit=None, with_dates=False):
    """Compact one-line-per-model list of ALL models, sorted by quality desc."""
    ordered = sorted(raw_models, key=lambda m: (m.get('quality', 0), m.get('recency', 0)), reverse=True)
    if limit and limit > 0:
        ordered = ordered[:limit]
    return "\n".join(_model_line(m, i + 1, with_dates) for i, m in enumerate(ordered))


def get_models_top_list(label_ru, label_uk, label_en, n=20, with_dates=False):
    """Top-N models as one-line entries with header."""
    ordered = sorted(raw_models, key=lambda m: (m.get('quality', 0), m.get('recency', 0)), reverse=True)[:n]
    header = f'<div class="model-list-header">{t(label_ru, label_uk, label_en)}</div>'
    return header + "\n" + "\n".join(_model_line(m, i + 1, with_dates) for i, m in enumerate(ordered))
