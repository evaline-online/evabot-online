import { ModelRegistry, GeminiModelInfo } from '../models/ModelRegistry.js';

export interface TokenUsageRecord {
  timestamp: string;
  modelId: string;
  agentId?: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  savedUSD: number;
}

export interface InfraCostItem {
  resource: string;
  specification: string;
  location: string;
  monthlyCostUSD: number;
  hourlyCostUSD: number;
  category: 'compute' | 'storage' | 'network' | 'subscription';
}

export interface CapitalExpenseItem {
  item: string;
  usd: number;
  date: string;
  note: string;
}

/**
 * One-time capital investments ledger (CapEx) — distinct from recurring monthly OpEx.
 */
export class CapitalExpenses {
  private static readonly CAPITAL_LEDGER: CapitalExpenseItem[] = [
    {
      item: 'Google Cloud evabot-agent-vm (c3-standard-8) - $10/day server plan',
      usd: 300,
      date: '2026-09-01',
      note: '$300 of $500 investment - server $10/day',
    },
    {
      item: 'Subscriptions (AI providers, tools)',
      usd: 100,
      date: '2026-09-01',
      note: '$100 of $500 - subscriptions',
    },
    {
      item: 'API tokens (OpenRouter, HuggingFace, Z.ai, Groq, Cerebras, Mistral, Cloudflare)',
      usd: 100,
      date: '2026-09-01',
      note: '$100 of $500 - API tokens',
    },
    {
      item: 'Google Pixel 10 Pro XL (control panel + Google account registration device)',
      usd: 1000,
      date: '2026-09-01',
      note: 'smartphone as remote control & account registry',
    },
  ];

  public static getCapitalExpenses(): CapitalExpenseItem[] {
    return [...this.CAPITAL_LEDGER];
  }

  public static getTotalCapitalUSD(): number {
    return this.CAPITAL_LEDGER.reduce((acc, item) => acc + item.usd, 0);
  }

  public static formatCapitalSection(): string {
    const lines: string[] = [];
    lines.push('  [4] КАПИТАЛЬНЫЕ ИНВЕСТИЦИИ (CAPITAL INVESTMENTS // Разовые вложения CapEx):');
    lines.push('  ────────────────────────────────────────────────────────────────────────────');
    for (const item of this.CAPITAL_LEDGER) {
      const name = item.item.length > 62 ? item.item.substring(0, 59) + '...' : item.item;
      lines.push(`  • ${name}`);
      lines.push(`      Сумма: $${item.usd.toFixed(2)} | Дата: ${item.date}`);
      lines.push(`      Примечание: ${item.note}`);
    }
    lines.push('  ────────────────────────────────────────────────────────────────────────────');
    lines.push(`  ИТОГО КАПИТАЛЬНЫЕ ИНВЕСТИЦИИ:                       $${this.getTotalCapitalUSD().toFixed(2)}`);
    return lines.join('\n');
  }
}

export interface AgentUnitCostSpec {
  role: string;
  modelId: string;
  modelName: string;
  isFree: boolean;
  baseInfraCostPerHour: number;
  tokenCostPer1kTurnsUSD: number;
  creationCostUSD: number;
  typicalTaskCostUSD: number;
}

export class AccountingEngine {
  private static records: TokenUsageRecord[] = [];
  
  // Baseline GCP Cluster & Service Subscriptions (Monthly OpEx)
  private static readonly INFRA_INVENTORY: InfraCostItem[] = [
    {
      resource: 'EvaBrain Core (evabot-agent-vm)',
      specification: '8 vCPU Intel Sapphire Rapids, 32 GB RAM',
      location: 'GCP europe-west3-a (Frankfurt)',
      monthlyCostUSD: 178.40,
      hourlyCostUSD: 0.2478,
      category: 'compute',
    },
    {
      resource: 'EvaFace Edge (evaline-micro-vm)',
      specification: '2 vCPU e2-micro, 1 GB RAM (OOM Shield)',
      location: 'GCP us-central1-a (Iowa)',
      monthlyCostUSD: 7.14,
      hourlyCostUSD: 0.0099,
      category: 'compute',
    },
    {
      resource: 'Persistent Disks (SSD / NVMe)',
      specification: '100 GB Root + /data (Swap + ChromaDB + Backups)',
      location: 'GCP multi-region',
      monthlyCostUSD: 12.00,
      hourlyCostUSD: 0.0167,
      category: 'storage',
    },
    {
      resource: 'Network & WireGuard Mesh',
      specification: 'Egress Traffic, QUIC HTTP/3, Static IPs',
      location: 'Global Backbone',
      monthlyCostUSD: 5.00,
      hourlyCostUSD: 0.0069,
      category: 'network',
    },
    {
      resource: 'Google AI Pro / Workspace',
      specification: 'Gemini 2.5/3.1/3.8 Pro/Flash ADC Quotas',
      location: 'Google Cloud Platform',
      monthlyCostUSD: 20.00,
      hourlyCostUSD: 0.0278,
      category: 'subscription',
    },
    {
      resource: 'Google Colab Pro Reserve',
      specification: 'GPU/TPU A100/L4 Fine-Tuning & Embeddings',
      location: 'Google Colab Cluster',
      monthlyCostUSD: 10.00,
      hourlyCostUSD: 0.0139,
      category: 'subscription',
    },
    {
      resource: 'OpenRouter Paid Credit Buffer',
      specification: 'Pre-paid API Buffer for Proprietary Fallbacks',
      location: 'Global Gateway',
      monthlyCostUSD: 25.00,
      hourlyCostUSD: 0.0347,
      category: 'subscription',
    },
  ];

  /**
   * Records token usage and computes exact cost / savings against paid commercial baseline
   */
  public static recordUsage(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    agentId?: string
  ): TokenUsageRecord {
    const model = ModelRegistry.getModelById(modelId);
    let costUSD = 0;
    let savedUSD = 0;

    const isFree = !model || model.pricing.freeTierStatus === '100% Free Quota Available';

    if (model) {
      const inRate = this.parsePrice(model.pricing.inputPer1MTokensUSD);
      const outRate = this.parsePrice(model.pricing.outputPer1MTokensUSD);

      if (isFree) {
        costUSD = 0;
        // Commercial benchmark saving vs GPT-4o / Claude 3.5 Sonnet ($3.00 in / $15.00 out)
        savedUSD = (inputTokens / 1_000_000) * 2.50 + (outputTokens / 1_000_000) * 10.00;
      } else {
        costUSD = (inputTokens / 1_000_000) * inRate + (outputTokens / 1_000_000) * outRate;
        savedUSD = 0;
      }
    }

    const rec: TokenUsageRecord = {
      timestamp: new Date().toISOString(),
      modelId,
      agentId,
      inputTokens,
      outputTokens,
      costUSD,
      savedUSD,
    };

    this.records.push(rec);
    return rec;
  }

  private static parsePrice(priceStr: string): number {
    if (!priceStr || priceStr.includes('$0.00')) return 0;
    const match = priceStr.match(/\$([0-9.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  public static getTotalMonthlyInfraCost(): number {
    return this.INFRA_INVENTORY.reduce((acc, item) => acc + item.monthlyCostUSD, 0);
  }

  public static getTotalHourlyInfraCost(): number {
    return this.INFRA_INVENTORY.reduce((acc, item) => acc + item.hourlyCostUSD, 0);
  }

  public static getInfraInventory(): InfraCostItem[] {
    return [...this.INFRA_INVENTORY];
  }

  public static getUsageSummary(since?: number): {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUSD: number;
    totalSavedUSD: number;
  } {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUSD = 0;
    let totalSavedUSD = 0;
    let totalCalls = 0;

    for (const r of this.records) {
      if (since !== undefined && new Date(r.timestamp).getTime() < since) continue;
      totalCalls += 1;
      totalInputTokens += r.inputTokens;
      totalOutputTokens += r.outputTokens;
      totalCostUSD += r.costUSD;
      totalSavedUSD += r.savedUSD;
    }

    return {
      totalCalls,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCostUSD,
      totalSavedUSD,
    };
  }

  /**
   * Calculates unit economics of creating and running an autonomous agent
   */
  public static calculateAgentUnitCost(role: string, modelId: string): AgentUnitCostSpec {
    const model = ModelRegistry.getModelById(modelId) || ModelRegistry.getAllModels()[0];
    const isFree = model.pricing.freeTierStatus === '100% Free Quota Available';

    const hourlyInfraShare = this.getTotalHourlyInfraCost() / 10; // Shared across typical 10-agent team
    const inPrice = this.parsePrice(model.pricing.inputPer1MTokensUSD);
    const outPrice = this.parsePrice(model.pricing.outputPer1MTokensUSD);

    // 1000 turns = ~200k input tokens + ~100k output tokens
    const tokenCostPer1kTurnsUSD = isFree
      ? 0
      : (200_000 / 1_000_000) * inPrice + (100_000 / 1_000_000) * outPrice;

    // Creation cost: compiling system prompt + RAG search + memory initialization (~2k tokens)
    const creationCostUSD = isFree
      ? 0.0000
      : (2_000 / 1_000_000) * inPrice;

    // Typical single task (e.g. write code, review, refactor): 5 turns = ~10k tokens
    const typicalTaskCostUSD = isFree
      ? 0.0000
      : (10_000 / 1_000_000) * inPrice + (3_000 / 1_000_000) * outPrice;

    return {
      role,
      modelId: model.id,
      modelName: model.name,
      isFree,
      baseInfraCostPerHour: parseFloat(hourlyInfraShare.toFixed(4)),
      tokenCostPer1kTurnsUSD: parseFloat(tokenCostPer1kTurnsUSD.toFixed(4)),
      creationCostUSD: parseFloat(creationCostUSD.toFixed(6)),
      typicalTaskCostUSD: parseFloat(typicalTaskCostUSD.toFixed(4)),
    };
  }

  /**
   * Generates a complete financial statement and ledger for the terminal
   */
  public static formatCostReport(): string {
    const summary = this.getUsageSummary();
    const totalInfraMonthly = this.getTotalMonthlyInfraCost();
    const totalInfraHourly = this.getTotalHourlyInfraCost();

    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    lines.push('  $ ФИНАНСОВЫЙ ОТЧЕТ И КАЛЬКУЛЯТОР СЕБЕСТОИМОСТИ (COST LEDGER)');
    lines.push('═'.repeat(78));
    lines.push('');
    lines.push('  [1] ИНФРАСТРУКТУРА КЛАСТЕРА И ПОДПИСКИ (ФИКСИРОВАННЫЕ РАСХОДЫ // OpEx):');
    lines.push('  ────────────────────────────────────────────────────────────────────────────');
    lines.push('  РЕСУРС / ОБОРУДОВАНИЕ            ЛОКАЦИЯ               В МЕСЯЦ       В ЧАС');
    lines.push('  ────────────────────────────────────────────────────────────────────────────');

    for (const item of this.INFRA_INVENTORY) {
      const name = item.resource.padEnd(32).substring(0, 32);
      const loc = item.location.padEnd(20).substring(0, 20);
      const mCost = `$${item.monthlyCostUSD.toFixed(2)}`.padStart(10);
      const hCost = `$${item.hourlyCostUSD.toFixed(4)}`.padStart(10);
      lines.push(`  ${name} ${loc} ${mCost}  ${hCost}`);
    }

    lines.push('  ────────────────────────────────────────────────────────────────────────────');
    lines.push(`  ИТОГО ФИКСИРОВАННАЯ ИНФРАСТРУКТУРА:               $${totalInfraMonthly.toFixed(2)}/мес  $${totalInfraHourly.toFixed(4)}/час`);
    lines.push('');
    lines.push('  [2] ПЕРЕМЕННЫЕ ЗАТРАТЫ НА ТОКЕНЫ И НЕЙРОЯДРА (ТЕКУЩАЯ СЕССИЯ):');
    lines.push(`  • Всего вызовов API       : ${summary.totalCalls}`);
    lines.push(`  • Использовано токенов   : ${summary.totalTokens.toLocaleString()} (${summary.totalInputTokens.toLocaleString()} in / ${summary.totalOutputTokens.toLocaleString()} out)`);
    lines.push(`  • Реальные затраты на API : $${summary.totalCostUSD.toFixed(4)} (Благодаря 100% Free Quota парку)`);
    lines.push(`  • ЭКОНОМИЯ НА FREE-ФЛОТЕ  : $${summary.totalSavedUSD.toFixed(4)} USD (относительно коммерческих GPT-4o/Claude)`);
    lines.push('');
    lines.push('  [3] КАЛЬКУЛЯЦИЯ СЕБЕСТОИМОСТИ СОЗДАНИЯ И РАБОТЫ 1 ИИ-АГЕНТА:');
    
    const sampleAgents = [
      { role: 'Lead Architect (2026 Frontier)', model: 'gemini-3.8-flash' },
      { role: 'Deep Reasoner & Planner', model: 'gemini-3.1-pro' },
      { role: 'Fast Code Refactorer', model: 'gemini-3.1-flash' },
      { role: 'Autonomous RedTeam Auditor', model: 'deepseek/deepseek-r1:free' },
      { role: 'Commercial Flagship (Paid Fallback)', model: 'claude-3-7-sonnet' },
    ];

    lines.push('  ────────────────────────────────────────────────────────────────────────────');
    lines.push('  РОЛЬ АГЕНТА               МОДЕЛЬ               СОЗДАНИЕ    ЗАДАЧА     СТАТУС');
    lines.push('  ────────────────────────────────────────────────────────────────────────────');

    for (const a of sampleAgents) {
      const spec = this.calculateAgentUnitCost(a.role, a.model);
      const roleStr = spec.role.padEnd(25).substring(0, 25);
      const modelStr = spec.modelId.padEnd(20).substring(0, 20);
      const createStr = `$${spec.creationCostUSD.toFixed(4)}`.padStart(10);
      const taskStr = `$${spec.typicalTaskCostUSD.toFixed(4)}`.padStart(10);
      const badge = spec.isFree ? '[100% FREE]' : '[PAID]';
      lines.push(`  ${roleStr} ${modelStr} ${createStr} ${taskStr}  ${badge}`);
    }

    lines.push('  ────────────────────────────────────────────────────────────────────────────');
    lines.push('  * ВЫВОД: Себестоимость создания агента на базе Gemini 3.8 / 3.1 Pro равна $0.00.');
    lines.push(`  Базовая стоимость работы роя из 10 агентов: $${(totalInfraHourly).toFixed(4)}/час за весь кластер.`);
    lines.push('');
    lines.push(CapitalExpenses.formatCapitalSection());
    lines.push('═'.repeat(78));
    return lines.join('\n');
  }
}
