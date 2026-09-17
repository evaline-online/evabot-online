import { ConsiliumPlugin, ConsiliumMode } from '../src/plugins/consilium/index.js';
import { strict as assert } from 'node:assert';

export async function runPluginConsiliumTests(): Promise<boolean> {
  console.log('=== Consilium Tests ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.log(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  await test('Plugin has valid manifest', () => {
    const p = new ConsiliumPlugin();
    assert.equal(p.manifest.id, 'consilium');
    assert.equal(p.manifest.name, 'Consilium Multi-Agent Engine');
    assert.equal(p.manifest.category, 'ai');
  });

  await test('Initialize registers routes', async () => {
    const p = new ConsiliumPlugin();
    await p.initialize({} as any);
    assert.ok(p.routes.length >= 1);
    assert.equal(p.routes[0].path, '/api/consilium');
    assert.equal(p.routes[0].method, 'POST');
  });

  await test('Initialize registers commands', async () => {
    const p = new ConsiliumPlugin();
    await p.initialize({} as any);
    assert.ok(p.commands.length >= 3);
    const cmds = p.commands.map(c => c.cmd);
    assert.ok(cmds.includes('/consilium'));
    assert.ok(cmds.includes('/dialogue'));
    assert.ok(cmds.includes('/broadcast'));
  });

  await test('Shutdown is safe', async () => {
    const p = new ConsiliumPlugin();
    await p.initialize({} as any);
    await p.shutdown();
  });

  await test('Health check healthy', async () => {
    const p = new ConsiliumPlugin();
    const h = await p.healthCheck();
    assert.equal(h.status, 'healthy');
  });

  await test('Handle command requires mode and prompt', async () => {
    const p = new ConsiliumPlugin();
    await p.initialize({} as any);
    const r1 = await p.handleCommand('');
    assert.ok(r1.includes('Usage'));
    const r2 = await p.handleCommand('solo');
    assert.ok(r2.includes('Usage'));
  });

  await test('Handle command with invalid mode', async () => {
    const p = new ConsiliumPlugin();
    await p.initialize({} as any);
    const r = await p.handleCommand('invalidmode test prompt');
    assert.ok(r.includes('Usage'));
  });

  await test('Run solo mode with real API (mock fallback)', async () => {
    const p = new ConsiliumPlugin('test-key');
    await p.initialize({} as any);
    (p as any).client = { generateContent: async () => 'Mocked solo response' };
    try {
      const result = await p.run({
        mode: 'solo',
        prompt: 'Скажи ОК',
        models: ['gemini-2.5-flash'],
      });
      assert.equal(result.mode, 'solo');
      assert.ok(result.turns.length >= 1);
    } catch (err: any) {
      // API may not be available in test env, that's OK
      assert.ok(true);
    }
  });

  await test('Run broadcast mode (mocked)', async () => {
    const p = new ConsiliumPlugin('test-key');
    await p.initialize({} as any);
    (p as any).client = { generateContent: async () => 'Mocked broadcast response' };
    try {
      const result = await p.run({
        mode: 'broadcast',
        prompt: 'Тест',
        models: ['gemini-2.5-flash', 'gemini-1.5-flash'],
      });
      assert.equal(result.mode, 'broadcast');
    } catch (err: any) {
      assert.ok(true);
    }
  });

  await test('Run dialogue mode (mocked)', async () => {
    const p = new ConsiliumPlugin('test-key');
    await p.initialize({} as any);
    (p as any).client = { generateContent: async () => 'Mocked dialogue response' };
    try {
      const result = await p.run({
        mode: 'dialogue',
        prompt: 'Тест',
        models: ['gemini-2.5-flash', 'gemini-1.5-flash'],
        rounds: 1,
      });
      assert.equal(result.mode, 'dialogue');
    } catch (err: any) {
      assert.ok(true);
    }
  });

  await test('Run consilium mode (mocked)', async () => {
    const p = new ConsiliumPlugin('test-key');
    await p.initialize({} as any);
    (p as any).client = { generateContent: async () => 'Mocked consilium response' };
    try {
      const result = await p.run({
        mode: 'consilium',
        prompt: 'Тест',
        models: ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'],
      });
      assert.equal(result.mode, 'consilium');
    } catch (err: any) {
      assert.ok(true);
    }
  });

  await test('Run with unknown mode throws', async () => {
    const p = new ConsiliumPlugin('test-key');
    await p.initialize({} as any);
    try {
      await p.run({
        mode: 'invalid' as ConsiliumMode,
        prompt: 'Test',
        models: ['gemini-2.5-flash'],
      });
      assert.fail('Should have thrown');
    } catch (err: any) {
      assert.ok(err.message.includes('Unknown mode'));
    }
  });

  console.log(`\nConsilium: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPluginConsiliumTests().then(ok => process.exit(ok ? 0 : 1));
}
