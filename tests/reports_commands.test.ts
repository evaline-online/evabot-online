import assert from 'node:assert';
import { IdeaCommand, buildIdeaParticipants } from '../src/core/IdeaCommand.js';
import { ReportCommand } from '../src/core/ReportCommand.js';
import { alertManager } from '../src/core/AlertManager.js';

export async function runReportsCommandsTests(): Promise<boolean> {
  console.log('\n--- Running Report/Idea Commands Tests (/error /bug /errors /idea) ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  try {
    // --- /idea roster builder (no LLM call) ---
    const roster = buildIdeaParticipants();
    assert(roster.length === 7, 'buildIdeaParticipants returns 7 specialists');
    assert(new Set(roster.map((p) => p.id)).size === 7, 'participant ids are unique');
    assert(new Set(roster.map((p) => p.systemPrompt)).size === 7, 'systemPrompts are distinct');
    assert(new Set(roster.map((p) => p.model)).size === 7, 'models are distinct (free tier)');
    assert(roster.every((p) => (p.systemPrompt || '').length > 20), 'each systemPrompt is meaningful');

    // --- /idea without topic → help (en + ru) ---
    const bare = await IdeaCommand.execute('');
    assert(bare.includes('/idea <тема>'), 'bare /idea → help lists /idea <тема>');
    assert(bare.includes('EN:') && bare.includes('RU:'), 'help contains EN + RU brief');
    const helpOut = await IdeaCommand.execute('   ');
    assert(helpOut.includes('/idea <тема>'), 'whitespace-only topic → help');

    // --- /error without desc → usage ---
    assert((await ReportCommand.execute('/error')).includes('Usage: /error'), '/error without desc → usage');
    assert((await ReportCommand.execute('/bug')).includes('Usage: /bug'), '/bug without desc → usage');
    assert((await ReportCommand.execute('/whoami')).includes('Unknown command for ReportCommand'), 'unknown head → error');

    // --- /error with desc → alert registered ---
    const errStamp = `web-cli smoke error ${Date.now()}`;
    const errOut = await ReportCommand.execute(`/error ${errStamp}`);
    assert(errOut.startsWith('[OK] Report #'), '/error returns [OK] Report #<id> confirmation');
    const errId = errOut.match(/#([\w-]+)/)?.[1] || '';
    const errEvent = alertManager.getRecentAlerts(50).find((a) => a.id === errId);
    assert(!!errEvent, '/error alert appears in AlertManager list');
    assert(errEvent?.severity === 'medium', '/error alert severity is medium');
    assert((errEvent?.metadata as Record<string, unknown>)?.type === 'error-report', '/error alert metadata type=error-report');
    assert((errEvent?.metadata as Record<string, unknown>)?.source === 'web-cli', '/error alert metadata source=web-cli');
    assert((errEvent?.message || '').includes(errStamp), '/error alert message carries description');

    // --- /bug with desc → alert registered ---
    const bugStamp = `web-cli smoke bug ${Date.now()}`;
    const bugOut = await ReportCommand.execute(`/bug ${bugStamp}`);
    assert(bugOut.startsWith('[OK] Report #'), '/bug returns [OK] Report #<id> confirmation');
    const bugId = bugOut.match(/#([\w-]+)/)?.[1] || '';
    const bugEvent = alertManager.getRecentAlerts(50).find((a) => a.id === bugId);
    assert(!!bugEvent, '/bug alert appears in AlertManager list');
    assert(bugEvent?.severity === 'medium', '/bug alert severity is medium');
    assert((bugEvent?.metadata as Record<string, unknown>)?.type === 'bug-report', '/bug alert metadata type=bug-report');

    // --- long desc truncated to 500 chars ---
    const longOut = await ReportCommand.execute(`/bug ${'x'.repeat(700)}`);
    assert(longOut.startsWith('[OK] Report #'), 'long /bug desc still registers');
    const longId = longOut.match(/#([\w-]+)/)?.[1] || '';
    const longEvent = alertManager.getRecentAlerts(50).find((a) => a.id === longId);
    assert((longEvent?.message || '').length === 500, 'long description truncated to 500 chars');

    // --- /errors listing ---
    const listOut = await ReportCommand.execute('/errors');
    assert(typeof listOut === 'string' && listOut.length > 0, '/errors returns text');
    assert(
      listOut.includes('[OK] No system errors') || listOut.includes('✅ No system errors') || /\[\d{2}:\d{2}\] \[[A-Z]+\]/.test(listOut),
      '/errors formatted as [HH:MM] [SEVERITY] lines (or all-clear)',
    );
    assert(listOut.includes(errStamp) || listOut.includes(bugStamp), '/errors includes the freshly registered reports');
  } catch (err: unknown) {
    console.error(`  ✗ FAIL: unexpected exception: ${err instanceof Error ? err.stack : String(err)}`);
    passed = false;
  }

  console.log(passed ? '  Reports/Idea Commands: ALL PASS' : '  Reports/Idea Commands: FAILURES');
  return passed;
}

// Allow standalone execution: npx tsx tests/reports_commands.test.ts
if (process.argv[1] && process.argv[1].includes('reports_commands')) {
  runReportsCommandsTests().then((ok) => process.exit(ok ? 0 : 1));
}
