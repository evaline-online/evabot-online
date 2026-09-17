import { LLMProvidersPlugin, LLMRequest } from '../src/plugins/llm-providers/index.js';
import { strict as assert } from 'node:assert';

export async function runLLMProvidersTests(): Promise<boolean> {
  console.log('=== LLMProvidersPlugin Tests ===\n');
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

  const plugin = new LLMProvidersPlugin();

  await test('Plugin has valid manifest', () => {
    assert.equal(plugin.manifest.id, 'llm-providers');
    assert.equal(plugin.manifest.name, 'LLM Multi-Provider Gateway');
    assert.equal(plugin.manifest.version, '1.0.0');
    assert.equal(plugin.manifest.category, 'ai');
    assert.equal(plugin.manifest.enabled, true);
  });

  await test('Initialize registers routes and commands', async () => {
    const mockContext = {
      config: {},
      logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
      eventBus: { on: () => {}, off: () => {}, emit: async () => {}, clear: () => {} },
      registerRoute: () => {},
      registerCommand: () => {},
      getStorage: () => null,
    };
    await plugin.initialize(mockContext as any);
    assert.ok(plugin.routes.length >= 3);
    assert.ok(plugin.commands.length >= 1);
  });

  await test('Shutdown clears providers', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    await p.shutdown();
  });

  await test('Register custom provider', () => {
    const p = new LLMProvidersPlugin();
    p.registerProvider({
      id: 'custom',
      name: 'Custom',
      baseUrl: 'http://custom',
      apiKey: 'key',
      enabled: true,
      freeOnly: false,
    });
    const got = p.getProvider('custom');
    assert.ok(got);
    assert.equal(got!.name, 'Custom');
  });

  await test('Get non-existent provider', () => {
    const p = new LLMProvidersPlugin();
    const got = p.getProvider('nonexistent');
    assert.equal(got, undefined);
  });

  await test('Resolve Google provider', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const prov = p.resolveProvider('gemini-2.5-flash');
    assert.equal(prov.id, 'google');
  });

  await test('Resolve OmniRoute provider for omniroute/ prefix', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const prov = p.resolveProvider('omniroute/gemini-2.5-flash');
    assert.equal(prov.id, 'omniroute');
  });

  await test('Resolve OpenCode provider', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const prov = p.resolveProvider('opencode/zen-fast');
    assert.equal(prov.id, 'opencode');
  });

  await test('Resolve OpenRouter for Claude', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const prov = p.resolveProvider('claude-3-5-sonnet');
    assert.equal(prov.id, 'openrouter');
  });

  await test('Resolve OpenRouter for GPT', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const prov = p.resolveProvider('gpt-4o');
    assert.equal(prov.id, 'openrouter');
  });

  await test('Resolve KiloCode', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const prov = p.resolveProvider('kilo/minimax-m3');
    assert.equal(prov.id, 'kilocode');
  });

  await test('Provider status returns all providers', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const status = p.getProviderStatus();
    assert.equal(status.length, 5);
    assert.ok(status.find((s: any) => s.id === 'google'));
    assert.ok(status.find((s: any) => s.id === 'omniroute'));
    assert.ok(status.find((s: any) => s.id === 'openrouter'));
    assert.ok(status.find((s: any) => s.id === 'opencode'));
    assert.ok(status.find((s: any) => s.id === 'kilocode'));
  });

  await test('Format provider list', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const output = p.formatProviderList();
    assert.ok(output.includes('google'));
    assert.ok(output.includes('omniroute'));
    assert.ok(output.includes('openrouter'));
    assert.ok(output.includes('opencode'));
    assert.ok(output.includes('kilocode'));
  });

  await test('Health check returns healthy', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const health = await p.healthCheck();
    assert.equal(health.status, 'healthy');
  });

  await test('Health check returns down when no enabled', async () => {
    const p = new LLMProvidersPlugin();
    const health = await p.healthCheck();
    assert.equal(health.status, 'down');
  });

  await test('cleanModelId strips provider prefix', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const cleaned = (p as any).cleanModelId('omniroute/gemini-2.5-flash', p.resolveProvider('omniroute/gemini-2.5-flash'));
    assert.equal(cleaned, 'gemini-2.5-flash');
  });

  await test('cleanModelId keeps no prefix', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const cleaned = (p as any).cleanModelId('gemini-2.5-flash', p.resolveProvider('gemini-2.5-flash'));
    assert.equal(cleaned, 'gemini-2.5-flash');
  });

  await test('testProvider returns error for unknown', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    try {
      await p.testProvider('unknown');
      assert.fail('Should throw');
    } catch (err: any) {
      assert.ok(err.message.includes('Unknown provider'));
    }
  });

  await test('Chat throws for disabled provider', async () => {
    const p = new LLMProvidersPlugin();
    await p.initialize({} as any);
    const prov = p.getProvider('openrouter')!;
    prov.enabled = false;
    try {
      await p.chat({ model: 'gpt-4o', messages: [] } as LLMRequest);
      assert.fail('Should throw');
    } catch (err: any) {
      assert.ok(err.message.includes('disabled'));
    }
  });

  console.log(`\nLLMProviders: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLLMProvidersTests().then(ok => process.exit(ok ? 0 : 1));
}
