import { ConsiliumEngine, ConsiliumParticipant } from './ConsiliumEngine.js';
import { Config } from './Config.js';
import { logger } from './Logger.js';

const IDEAS_TIMEOUT_MS = 120_000;

const CARD_DELIVERABLE =
  'Structure every reply as an idea card: (1) up to 3 concept directions, ' +
  '(2) name/tagline options, (3) target audience, (4) USP, ' +
  '(5) quick-wins, (6) risks, (7) next steps. Be concise and concrete.';

/**
 * Brainstorm roster: 7 independent specialists on free-tier models.
 * Exported for testability (no LLM call required to inspect the roster).
 */
export function buildIdeaParticipants(): ConsiliumParticipant[] {
  return [
    {
      id: 'idea-1-creative-director',
      model: 'gemini-3.8-flash',
      name: 'Creative Director',
      title: 'Creative Director',
      temperature: 0.9,
      systemPrompt: `You are a Creative Director. Generate bold ideas and unexpected angles.\n${CARD_DELIVERABLE}`,
    },
    {
      id: 'idea-2-brand-designer',
      model: 'omniroute/gemini-3.8-flash',
      name: 'Brand Designer',
      title: 'Brand Designer',
      temperature: 0.8,
      systemPrompt: `You are a Brand Designer. Focus on visual identity, aesthetics and memorable brand cues.\n${CARD_DELIVERABLE}`,
    },
    {
      id: 'idea-3-ux-designer',
      model: 'qwen/qwen-2.5-coder-32b-instruct:free',
      name: 'UX/Product Designer',
      title: 'UX & Product Designer',
      temperature: 0.7,
      systemPrompt: `You are a UX/Product Designer. Focus on usability and the end-to-end user journey.\n${CARD_DELIVERABLE}`,
    },
    {
      id: 'idea-4-market-analyst',
      model: 'gemini-3.1-pro',
      name: 'Market Analyst',
      title: 'Market Analyst',
      temperature: 0.5,
      systemPrompt: `You are a Market Analyst. Ground ideas in competitors, trends and data; cite concrete numbers where possible.\n${CARD_DELIVERABLE}`,
    },
    {
      id: 'idea-5-product-manager',
      model: 'deepseek/deepseek-r1:free',
      name: 'Product Manager',
      title: 'Product Manager',
      temperature: 0.6,
      systemPrompt: `You are a Product Manager. Focus on feasibility, MVP scope and success metrics.\n${CARD_DELIVERABLE}`,
    },
    {
      id: 'idea-6-marketing-strategist',
      model: 'meta-llama/llama-3.3-70b:free',
      name: 'Marketing Strategist',
      title: 'Marketing Strategist',
      temperature: 0.7,
      systemPrompt: `You are a Marketing Strategist. Focus on positioning, channels and the ideal customer profile (ICP).\n${CARD_DELIVERABLE}`,
    },
    {
      id: 'idea-7-tech-lead',
      model: 'gemini-3.1-flash',
      name: 'Tech Lead',
      title: 'Tech Lead',
      temperature: 0.4,
      systemPrompt: `You are a Tech Lead. Focus on technical feasibility, stack choices and delivery risks.\n${CARD_DELIVERABLE}`,
    },
  ];
}

function evaSynthesizer(): ConsiliumParticipant {
  return {
    id: 'idea-8-eva',
    model: Config.defaultModel,
    name: 'Eva',
    title: 'Synthesizer',
    temperature: 0.3,
    systemPrompt:
      'You are Eva, the synthesizer of the EvaLine idea consilium. ' +
      'Weigh every specialist contribution, resolve conflicts, and merge the best concepts into one coherent recommendation.\n' +
      CARD_DELIVERABLE,
  };
}

function formatCard(topic: string, synthesis: string | undefined, participants: ConsiliumParticipant[], turns: Array<{ name?: string; content: string }>, durationMs: number): string {
  const lines: string[] = [
    '',
    '═'.repeat(78),
    `  [IDEA] AI CONSILIUM BRAINSTORM — "${topic.slice(0, 60)}${topic.length > 60 ? '…' : ''}"`,
    '═'.repeat(78),
    `  Panel: ${participants.map((p) => p.name).join(', ')}`,
    `  Rounds done, ${turns.length} expert turns, ${(durationMs / 1000).toFixed(1)}s`,
    '─'.repeat(78),
  ];
  if (synthesis && synthesis.trim()) {
    lines.push('  SYNTHESIS (Eva):');
    for (const raw of synthesis.trim().split('\n')) lines.push(`  ${raw}`);
  } else {
    lines.push('  EXPERT PERSPECTIVES:');
    for (const t of turns) {
      const name = t.name || 'Expert';
      lines.push(`  ▸ ${name}:`);
      for (const raw of (t.content || '').split('\n').slice(0, 12)) lines.push(`    ${raw}`);
    }
  }
  lines.push('═'.repeat(78));
  return lines.join('\n');
}

export class IdeaCommand {
  public static helpText(): string {
    return [
      '',
      '[IDEA] Usage: /idea <тема> — launches a 8-agent AI consilium brainstorm.',
      '',
      '  EN: /idea <topic> — 7 specialists + Eva synthesize an idea card:',
      '      3 concept directions, name/taglines, target audience, USP,',
      '      quick-wins, risks, next steps.',
      '  RU: /idea <тема> — консилиум из 7 специалистов + Ева',
      '      выдаёт карточку идеи: 3 направления, нейминг/слоган,',
      '      аудитория, УТП, быстрые победы, риски, следующие шаги.',
      '',
      '  Example / Пример: /idea EVA-коврики для Tesla Model Y',
    ].join('\n');
  }

  public static async execute(args: string): Promise<string> {
    const topic = (args || '').trim();
    if (!topic) {
      return this.helpText();
    }

    const participants: ConsiliumParticipant[] = [...buildIdeaParticipants(), evaSynthesizer()];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IDEAS_TIMEOUT_MS);

    try {
      const engine = new ConsiliumEngine(Config.geminiApiKey || undefined);
      const result = await engine.run({
        mode: 'consilium',
        prompt: topic,
        participants,
        rounds: 2,
        synthesizerModel: Config.defaultModel,
        signal: controller.signal,
      });
      const synthesis = (result as { synthesis?: string })?.synthesis;
      return formatCard(
        topic,
        synthesis,
        result.participants,
        result.turns,
        result.durationMs,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('IdeaCommand', `consilium brainstorm failed: ${msg}`);
      const aborted = /abort|timeout/i.test(msg);
      return `[ERROR] /idea failed${aborted ? ' (timeout 120s — try a narrower topic)' : ''}: ${msg}\nTry again later or use a shorter topic.`;
    } finally {
      clearTimeout(timer);
    }
  }
}
