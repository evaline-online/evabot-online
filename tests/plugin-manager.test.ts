import { PluginManager } from '../src/core/plugin-system/PluginManager.js';
import { Plugin, PluginManifest, PluginEventBus } from '../src/core/plugin-system/types.js';
import { strict as assert } from 'node:assert';

function makePluginId(): string {
  return 'test-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

class TestPlugin implements Plugin {
  public manifest: PluginManifest;
  public initCalled = false;
  public shutdownCalled = false;

  constructor(id?: string) {
    this.manifest = {
      id: id || makePluginId(),
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'For testing',
      enabled: true,
      category: 'core',
    };
  }

  async initialize(context: any): Promise<void> {
    this.initCalled = true;
    context.registerCommand('/test-' + this.manifest.id, async () => 'ok');
  }

  async shutdown(): Promise<void> {
    this.shutdownCalled = true;
  }

  async healthCheck() {
    return { status: 'healthy' as const, message: 'ok' };
  }
}

class DependentPlugin implements Plugin {
  public manifest: PluginManifest = {
    id: 'dep-' + makePluginId(),
    name: 'Dependent',
    version: '1.0.0',
    description: 'Depends',
    enabled: true,
    category: 'core',
    dependencies: ['nonexistent-' + makePluginId()],
  };

  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}
}

export async function runPluginManagerTests(): Promise<boolean> {
  console.log('=== PluginManager Tests ===\n');
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

  await test('PluginManager is singleton', () => {
    const a = PluginManager.getInstance();
    const b = PluginManager.getInstance();
    assert.equal(a, b);
  });

  await test('Register and retrieve plugin', async () => {
    const mgr = PluginManager.getInstance();
    const p = new TestPlugin();
    await mgr.register(p);
    const got = mgr.get(p.manifest.id);
    assert.ok(got);
    assert.equal(got, p);
    await mgr.shutdown(p.manifest.id);
  });

  await test('Plugin initialize was called', async () => {
    const mgr = PluginManager.getInstance();
    const p = new TestPlugin();
    await mgr.register(p);
    assert.equal(p.initCalled, true);
    await mgr.shutdown(p.manifest.id);
  });

  await test('Cannot register duplicate', async () => {
    const mgr = PluginManager.getInstance();
    const p = new TestPlugin();
    await mgr.register(p);
    try {
      await mgr.register(p);
      assert.fail('Should have thrown');
    } catch (err: any) {
      assert.ok(err.message.includes('already registered'));
    }
    await mgr.shutdown(p.manifest.id);
  });

  await test('Cannot register with missing dependency', async () => {
    const mgr = PluginManager.getInstance();
    const dep = new DependentPlugin();
    try {
      await mgr.register(dep);
      assert.fail('Should have thrown');
    } catch (err: any) {
      assert.ok(err.message.includes('Missing dependency'));
    }
  });

  await test('List plugins works', async () => {
    const mgr = PluginManager.getInstance();
    const list = mgr.list();
    assert.ok(Array.isArray(list));
  });

  await test('Get plugin status', async () => {
    const mgr = PluginManager.getInstance();
    const p = new TestPlugin();
    await mgr.register(p);
    const status = mgr.getStatus(p.manifest.id);
    assert.equal(status, 'active');
    await mgr.shutdown(p.manifest.id);
  });

  await test('Health check all plugins', async () => {
    const mgr = PluginManager.getInstance();
    const health = await mgr.healthCheckAll();
    assert.ok(typeof health === 'object');
  });

  await test('Disable and enable', async () => {
    const mgr = PluginManager.getInstance();
    const p = new TestPlugin();
    await mgr.register(p);
    await mgr.disable(p.manifest.id);
    assert.equal(mgr.getStatus(p.manifest.id), 'disabled');
    await mgr.enable(p.manifest.id);
    assert.equal(mgr.getStatus(p.manifest.id), 'active');
    await mgr.shutdown(p.manifest.id);
  });

  await test('Get commands includes registered', async () => {
    const mgr = PluginManager.getInstance();
    const p = new TestPlugin();
    await mgr.register(p);
    const cmds = mgr.getCommands();
    assert.ok(cmds.has('/test-' + p.manifest.id));
    await mgr.shutdown(p.manifest.id);
  });

  await test('Shutdown plugin', async () => {
    const mgr = PluginManager.getInstance();
    const p = new TestPlugin();
    await mgr.register(p);
    await mgr.shutdown(p.manifest.id);
    assert.equal(p.shutdownCalled, true);
  });

  await test('GetAllPluginRoutes works', () => {
    const mgr = PluginManager.getInstance();
    const routes = mgr.getAllPluginRoutes();
    assert.ok(Array.isArray(routes));
  });

  console.log(`\nPluginManager: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

export async function runEventBusTests(): Promise<boolean> {
  console.log('=== PluginEventBus Tests ===\n');
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

  await test('Subscribe and emit', async () => {
    const bus = new PluginEventBus();
    let received: any = null;
    bus.on('test', (data) => { received = data; });
    await bus.emit('test', { foo: 'bar' });
    assert.equal(received.foo, 'bar');
  });

  await test('Unsubscribe', async () => {
    const bus = new PluginEventBus();
    let count = 0;
    const handler = () => { count++; };
    bus.on('test', handler);
    bus.off('test', handler);
    await bus.emit('test', {});
    assert.equal(count, 0);
  });

  await test('Multiple handlers', async () => {
    const bus = new PluginEventBus();
    let count = 0;
    bus.on('test', () => { count++; });
    bus.on('test', () => { count++; });
    bus.on('test', () => { count++; });
    await bus.emit('test', {});
    assert.equal(count, 3);
  });

  await test('Async handler', async () => {
    const bus = new PluginEventBus();
    let resolved = false;
    bus.on('test', async () => {
      await new Promise(r => setTimeout(r, 10));
      resolved = true;
    });
    await bus.emit('test', {});
    assert.equal(resolved, true);
  });

  await test('Clear all handlers', async () => {
    const bus = new PluginEventBus();
    let count = 0;
    bus.on('a', () => { count++; });
    bus.on('b', () => { count++; });
    bus.clear();
    await bus.emit('a', {});
    await bus.emit('b', {});
    assert.equal(count, 0);
  });

  await test('Emit to non-existent event', async () => {
    const bus = new PluginEventBus();
    await bus.emit('nothing', {});
  });

  console.log(`\nEventBus: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const r1 = await runPluginManagerTests();
    const r2 = await runEventBusTests();
    process.exit(r1 && r2 ? 0 : 1);
  })();
}
