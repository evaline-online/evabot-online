/**
 * developer_mode.test.ts — SystemContext (FEATURE 1) + DeveloperMode (FEATURE 2)
 *
 * Covers:
 *  - Wrong password denied / correct password unlocks (constant-time verify)
 *  - TTL expiry via injected fake clock (no real timers)
 *  - /developer lock + status
 *  - Password masking for chat persistence (/developer unlock → ****)
 *  - SystemContext content: default model, VM names, company identity,
 *    product count, ≤1200 chars, 60s cache
 *  - /sys command output via ModelCommand
 */

import { DeveloperMode } from '../src/core/DeveloperMode.js';
import { SystemContext } from '../src/core/SystemContext.js';
import { ModelCommand, COMMAND_ALIASES, normalizeCommand } from '../src/models/ModelRatings.js';
import { Config } from '../src/core/Config.js';

export async function runDeveloperModeTests(): Promise<boolean> {
  console.log('\n--- Running DeveloperMode & SystemContext Tests ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  // Isolated fixture state per suite run.
  const realNow = Date.now;
  let fakeNow = realNow();
  DeveloperMode.setClock(() => fakeNow);
  DeveloperMode.resetAll();
  // Test password: set through env (DeveloperMode reads live env over Config).
  // Remember the real value (from .env) so it can be restored afterwards.
  const originalEnvPassword = process.env.EVADEV_PASSWORD;
  process.env.EVADEV_PASSWORD = 'test-dev-pass-9137';

  try {
    // 1. Wrong password denied
    {
      const ok = DeveloperMode.unlock('sess-a', 'wrong-password');
      assert(ok === false, 'unlock with wrong password is denied');
      assert(DeveloperMode.isUnlocked('sess-a') === false, 'session stays locked after wrong password');
      const out = ModelCommand.execute('/developer unlock wrong-password');
      assert(out.includes('Невірний пароль'), 'wrong password reply does not unlock');
      assert(!out.includes('wrong-password'), 'wrong password is never echoed back');
    }

    // 2. Correct password unlocks
    {
      const ok = DeveloperMode.unlock('sess-b', 'test-dev-pass-9137');
      assert(ok === true, 'unlock with correct password succeeds');
      assert(DeveloperMode.isUnlocked('sess-b') === true, 'session becomes unlocked');
      assert(DeveloperMode.ttlRemainingMs('sess-b') > 0, 'TTL is positive after unlock');
      const out = ModelCommand.execute('/developer unlock test-dev-pass-9137');
      assert(out.includes('АКТИВОВАНО') || out.includes('активовано'), 'unlock command replies success');
      assert(!out.includes('test-dev-pass-9137'), 'unlock reply does NOT echo the password');
    }

    // 3. Password-casing preserved through the raw-command path
    {
      DeveloperMode.resetAll();
      process.env.EVADEV_PASSWORD = 'MiXeD-Case-Pw';
      const out = ModelCommand.execute('/developer unlock MiXeD-Case-Pw');
      assert(DeveloperMode.isUnlocked('cli') === true, 'mixed-case password unlocks via ModelCommand (no lowercasing)');
      assert(!out.includes('MiXeD-Case-Pw'), 'mixed-case password never echoed');
      process.env.EVADEV_PASSWORD = 'test-dev-pass-9137';
      DeveloperMode.resetAll();
    }

    // 4. TTL expiry (fake clock)
    {
      DeveloperMode.resetAll();
      DeveloperMode.unlock('sess-ttl', 'test-dev-pass-9137');
      assert(DeveloperMode.isUnlocked('sess-ttl') === true, 'unlocked before TTL elapses');
      fakeNow += DeveloperMode.UNLOCK_TTL_MS - 1000;
      assert(DeveloperMode.isUnlocked('sess-ttl') === true, 'still unlocked 1s before TTL');
      fakeNow += DeveloperMode.UNLOCK_TTL_MS + 1000;
      assert(DeveloperMode.isUnlocked('sess-ttl') === false, 'expired right after TTL (2h)');
    }

    // 5. lock + status
    {
      DeveloperMode.resetAll();
      DeveloperMode.unlock('sess-c', 'test-dev-pass-9137');
      const locked = DeveloperMode.lock('sess-c');
      assert(locked === true, 'lock() reports the session was unlocked');
      assert(DeveloperMode.isUnlocked('sess-c') === false, 'session locked again');
      const status = DeveloperMode.statusLine('sess-c');
      assert(status.includes('ЗАЧИНЕНО'), 'status shows locked state');
      DeveloperMode.unlock('sess-d', 'test-dev-pass-9137');
      fakeNow += 30 * 60 * 1000; // +30 min
      const status2 = DeveloperMode.statusLine('sess-d');
      assert(status2.includes('АКТИВНИЙ') && status2.includes('90 хв'), 'status shows unlocked + remaining TTL');
    }

    // 6. Missing env → mode unavailable
    {
      DeveloperMode.resetAll();
      // Hermetic: getPassword() falls back to Config.developerPassword (loaded
      // from .env at import time), so stub both sources to force the empty
      // state — never touching the real .env file.
      const savedEnvPwd = process.env.EVADEV_PASSWORD;
      const savedConfigPwd = (Config as any).developerPassword;
      delete process.env.EVADEV_PASSWORD;
      (Config as any).developerPassword = '';
      try {
        const out = ModelCommand.execute('/developer unlock whatever');
        assert(out.includes('режим недоступний: встанови EVADEV_PASSWORD'), 'missing EVADEV_PASSWORD → unavailable notice');
      } finally {
        process.env.EVADEV_PASSWORD = savedEnvPwd;
        (Config as any).developerPassword = savedConfigPwd;
      }
    }

    // 7. Password masking in the persistence helper
    {
      const masked = DeveloperMode.maskPasswordIn('/developer unlock supersecret123');
      assert(masked === '/developer unlock ****', 'EN command password masked');
      const maskedUk = DeveloperMode.maskPasswordIn('/розробник unlock парольСекрет');
      assert(maskedUk === '/розробник unlock ****', 'UK alias password masked');
      const maskedTail = DeveloperMode.maskPasswordIn('/developer unlock  p@ss word tail');
      assert(maskedTail.includes('****') && !maskedTail.includes('p@ss'), 'password token masked, tail preserved');
      assert(DeveloperMode.maskPasswordIn('just a normal message') === 'just a normal message', 'normal text untouched');
      assert(
        DeveloperMode.maskPasswordIn('/developer unlock S3cret!') === '/developer unlock ****',
        'symbol-rich password fully masked'
      );
    }

    // 8. Aliases registered + normalizeCommand routing
    {
      assert(COMMAND_ALIASES['/система'] === '/sys', 'alias /система → /sys');
      assert(COMMAND_ALIASES['/системa'] === '/sys', 'alias /системa (latin a) → /sys');
      assert(COMMAND_ALIASES['/whereami'] === '/sys', 'alias /whereami → /sys');
      assert(COMMAND_ALIASES['/девелопер'] === '/developer', 'alias /девелопер → /developer');
      assert(COMMAND_ALIASES['/розробник'] === '/developer', 'alias /розробник → /developer');
      assert(normalizeCommand('/система').startsWith('/sys'), 'normalizeCommand resolves /система');
    }

    // 9. SystemContext content: model + VM + company + products
    {
      SystemContext.invalidate();
      const block = SystemContext.build();
      assert(block.includes(Config.defaultModel), `block includes configured default model (${Config.defaultModel})`);
      assert(block.includes('evabot-agent-vm'), 'block includes evabot-agent-vm');
      assert(block.includes('evaline-micro-vm'), 'block includes evaline-micro-vm');
      assert(block.includes('ЕВА-ЛАЙН'), 'block includes company name');
      assert(block.includes('40484497'), 'block includes ЄДРПОУ');
      assert(/\d+/.test(block), 'block includes numeric stats');
      assert(block.length <= 1200, `block ≤1200 chars (got ${block.length})`);
      assert(block.includes('Breakers:'), 'block includes breaker health summary');
    }

    // 10. /sys output via ModelCommand
    {
      const out = ModelCommand.execute('/sys');
      assert(out.includes(Config.defaultModel), '/sys output includes the default model');
      assert(out.includes('evabot-agent-vm'), '/sys output includes the brain VM');
      const outUk = ModelCommand.execute('/система');
      assert(outUk.includes(Config.defaultModel), 'ukrainian alias /система works');
    }

    // 11. Last-used model surfaces in SystemContext
    {
      SystemContext.invalidate();
      const { recordLastUsedModel } = await import('../src/core/SystemContext.js');
      recordLastUsedModel('test-model-x', 'google');
      const block = SystemContext.build();
      assert(block.includes('test-model-x'), 'block shows last-used model after recordLastUsedModel');
    }

    // 12. Developer prompt block content
    {
      assert(SystemContext.DEVELOPER_BLOCK.includes('режимі розробника'), 'DEVELOPER_BLOCK text present');
      assert(SystemContext.DEVELOPER_BLOCK.includes('Не приховуй'), 'DEVELOPER_BLOCK instructs full disclosure');
    }

    // 13. developer command parse edge cases
    {
      assert(DeveloperMode.parseCommand('/developer')?.sub === 'help', 'bare /developer → help');
      assert(DeveloperMode.parseCommand('/розробник status')?.sub === 'status', 'uk alias status subcommand');
      assert(DeveloperMode.parseCommand('/developer lock')?.sub === 'lock', 'lock subcommand');
      assert(DeveloperMode.parseCommand('/models') === null, 'non-developer command → null');
      assert(
        DeveloperMode.parseCommand('/developer unlock My Secret Pass')?.password === 'My Secret Pass',
        'password with spaces preserved'
      );
      const helpOut = ModelCommand.execute('/developer');
      assert(helpOut.includes('/developer unlock'), '/developer without subcommand prints usage');
    }
  } finally {
    // Restore real clock + env for subsequent suites.
    DeveloperMode.setClock(realNow);
    DeveloperMode.resetAll();
    if (originalEnvPassword !== undefined) {
      process.env.EVADEV_PASSWORD = originalEnvPassword;
    } else {
      delete process.env.EVADEV_PASSWORD;
    }
    SystemContext.invalidate();
  }

  console.log(`--- DeveloperMode & SystemContext Tests ${passed ? 'PASSED' : 'FAILED'} ---`);
  return passed;
}
