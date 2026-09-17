import { KnowledgeBasePlugin, KnowledgeDocument } from '../src/plugins/knowledge-base/index.js';
import { strict as assert } from 'node:assert';

export async function runKnowledgeBaseTests(): Promise<boolean> {
  console.log('=== KnowledgeBasePlugin Tests ===\n');
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
    const p = new KnowledgeBasePlugin();
    assert.equal(p.manifest.id, 'knowledge-base');
    assert.equal(p.manifest.name, 'EvaLine Knowledge Base');
    assert.equal(p.manifest.category, 'data');
  });

  await test('Add document', () => {
    const p = new KnowledgeBasePlugin();
    const doc: KnowledgeDocument = {
      id: 'test-1',
      title: 'Test Document',
      content: 'This is test content about EvaLine products and EVA materials',
      category: 'test',
      language: 'en',
      tags: ['test', 'evaline'],
      source: 'test.md',
    };
    p.addDocument(doc);
    const stats = p.getStats();
    assert.equal(stats.totalDocuments, 1);
  });

  await test('Search finds by title', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'eva-doc',
      title: 'EVA Sheets Guide',
      content: 'About EVA sheets for production',
      category: 'b2b',
      language: 'en',
      tags: ['eva', 'sheets'],
      source: 'eva.md',
    });
    const results = p.search('EVA Sheets');
    assert.ok(results.length > 0);
    assert.equal(results[0].id, 'eva-doc');
  });

  await test('Search finds by content', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'content-doc',
      title: 'Production',
      content: 'Detailed information about EVA material production process',
      category: 'production',
      language: 'en',
      tags: ['production'],
      source: 'prod.md',
    });
    const results = p.search('material production');
    assert.ok(results.length > 0);
  });

  await test('Search filters by language', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'en-doc',
      title: 'English Document',
      content: 'English content',
      category: 'test',
      language: 'en',
      tags: [],
      source: 'en.md',
    });
    p.addDocument({
      id: 'uk-doc',
      title: 'Український документ',
      content: 'Український контент',
      category: 'test',
      language: 'uk',
      tags: [],
      source: 'uk.md',
    });
    const enResults = p.search('Document', { language: 'en' });
    assert.equal(enResults.length, 1);
    assert.equal(enResults[0].language, 'en');
  });

  await test('Search filters by category', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'b2b-doc',
      title: 'B2B Document',
      content: 'business content',
      category: 'b2b',
      language: 'en',
      tags: [],
      source: 'b2b.md',
    });
    p.addDocument({
      id: 'b2c-doc',
      title: 'B2C Document',
      content: 'consumer content',
      category: 'b2c',
      language: 'en',
      tags: [],
      source: 'b2c.md',
    });
    const b2bResults = p.search('Document', { category: 'b2b' });
    assert.equal(b2bResults.length, 1);
    assert.equal(b2bResults[0].id, 'b2b-doc');
  });

  await test('Search respects limit', () => {
    const p = new KnowledgeBasePlugin();
    for (let i = 0; i < 10; i++) {
      p.addDocument({
        id: `doc-${i}`,
        title: `Test ${i}`,
        content: 'common content',
        category: 'test',
        language: 'en',
        tags: [],
        source: `${i}.md`,
      });
    }
    const results = p.search('common', { limit: 3 });
    assert.equal(results.length, 3);
  });

  await test('Search empty query returns empty', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'd1',
      title: 'Test',
      content: 'content',
      category: 'test',
      language: 'en',
      tags: [],
      source: 't.md',
    });
    const results = p.search('');
    assert.equal(results.length, 0);
  });

  await test('Search by tag', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'tagged',
      title: 'Some title',
      content: 'content',
      category: 'test',
      language: 'en',
      tags: ['production', 'eva'],
      source: 't.md',
    });
    const results = p.search('production');
    assert.ok(results.length > 0);
  });

  await test('List documents with filter', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'd1',
      title: 'D1',
      content: 'c',
      category: 'a',
      language: 'en',
      tags: [],
      source: 's',
    });
    p.addDocument({
      id: 'd2',
      title: 'D2',
      content: 'c',
      category: 'b',
      language: 'en',
      tags: [],
      source: 's',
    });
    const filtered = p.listDocuments({ category: 'a' });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'd1');
  });

  await test('List documents by language', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'd1',
      title: 'D1',
      content: 'c',
      category: 'a',
      language: 'en',
      tags: [],
      source: 's',
    });
    p.addDocument({
      id: 'd2',
      title: 'D2',
      content: 'c',
      category: 'a',
      language: 'ru',
      tags: [],
      source: 's',
    });
    const filtered = p.listDocuments({ language: 'ru' });
    assert.equal(filtered.length, 1);
  });

  await test('Stats correct', () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'd1',
      title: 'D1',
      content: 'c',
      category: 'a',
      language: 'en',
      tags: [],
      source: 's',
    });
    p.addDocument({
      id: 'd2',
      title: 'D2',
      content: 'c',
      category: 'b',
      language: 'ru',
      tags: [],
      source: 's',
    });
    const stats = p.getStats();
    assert.equal(stats.totalDocuments, 2);
    assert.equal(stats.languages.length, 2);
    assert.equal(stats.categories.length, 2);
  });

  await test('Health check shows healthy with documents', async () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'd1',
      title: 'D1',
      content: 'c',
      category: 'a',
      language: 'en',
      tags: [],
      source: 's',
    });
    const health = await p.healthCheck();
    assert.equal(health.status, 'healthy');
  });

  await test('Health check shows degraded with no documents', async () => {
    const p = new KnowledgeBasePlugin();
    const health = await p.healthCheck();
    assert.equal(health.status, 'degraded');
  });

  await test('Initialize registers routes', async () => {
    const p = new KnowledgeBasePlugin();
    await p.initialize({} as any);
    assert.ok(p.routes.length >= 3);
    const paths = p.routes.map(r => r.path);
    assert.ok(paths.includes('/api/kb/status'));
    assert.ok(paths.includes('/api/kb/search'));
    assert.ok(paths.includes('/api/kb/list'));
  });

  await test('Handle command help', async () => {
    const p = new KnowledgeBasePlugin();
    await p.initialize({} as any);
    const result = await p.handleCommand('help');
    assert.ok(result.includes('KB COMMANDS'));
  });

  await test('Handle command status', async () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'd1',
      title: 'D1',
      content: 'c',
      category: 'a',
      language: 'en',
      tags: [],
      source: 's',
    });
    await p.initialize({} as any);
    const result = await p.handleCommand('status');
    assert.ok(result.includes('1'));
  });

  await test('Handle command search requires query', async () => {
    const p = new KnowledgeBasePlugin();
    await p.initialize({} as any);
    const result = await p.handleCommand('search');
    assert.ok(result.includes('ERROR'));
  });

  await test('Handle unknown command', async () => {
    const p = new KnowledgeBasePlugin();
    await p.initialize({} as any);
    const result = await p.handleCommand('unknowncmd');
    assert.ok(result.includes('ERROR'));
  });

  await test('Shutdown clears documents', async () => {
    const p = new KnowledgeBasePlugin();
    p.addDocument({
      id: 'd1',
      title: 'D1',
      content: 'c',
      category: 'a',
      language: 'en',
      tags: [],
      source: 's',
    });
    await p.shutdown();
    const stats = p.getStats();
    assert.equal(stats.totalDocuments, 0);
  });

  console.log(`\nKnowledgeBase: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runKnowledgeBaseTests().then(ok => process.exit(ok ? 0 : 1));
}
