/**
 * populate-knowledge-db.ts — Populate data/knowledge.db (currently 0 bytes)
 * from markdown files in knowledge-base/.
 *
 * Creates: sources (file_path/title/language) + chunks (source_id/index/content)
 * Chunks are ~1400-char slices of each markdown file.
 *
 * Usage: npx tsx scripts/populate-knowledge-db.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const KB_DB = path.join(process.cwd(), 'data', 'knowledge.db');
const KB_ROOT = path.join(process.cwd(), 'knowledge-base');
const CHUNK_SIZE = 1400;

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.name.endsWith('.md') || entry.name.endsWith('.txt')) results.push(full);
  }
  return results;
}

function main(): void {
  const db = new DatabaseSync(KB_DB);
  db.exec(`
    DROP TABLE IF EXISTS chunks;
    DROP TABLE IF EXISTS sources;
    CREATE TABLE sources(id INTEGER PRIMARY KEY AUTOINCREMENT, file_path TEXT UNIQUE, title TEXT, language TEXT);
    CREATE TABLE chunks(id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER REFERENCES sources(id), chunk_index INTEGER, content TEXT, created_at TEXT);
  `);

  const insertSource = db.prepare('INSERT OR IGNORE INTO sources(file_path, title, language) VALUES (?, ?, ?)');
  const insertChunk = db.prepare('INSERT INTO chunks(source_id, chunk_index, content, created_at) VALUES (?, ?, ?, ?)');

  const files = walk(KB_ROOT);
  const now = new Date().toISOString();
  let totalFiles = 0;
  let totalChunks = 0;

  for (const file of files) {
    const relPath = file.replace(KB_ROOT + '/', '');
    const lang = /\buk\//.test(relPath) ? 'uk' : /\bru\//.test(relPath) ? 'ru' : /\bde\//.test(relPath) ? 'de' : /\bpl\//.test(relPath) ? 'pl' : /\bfr\//.test(relPath) ? 'fr' : 'en';
    const title = path.basename(file, path.extname(file));
    insertSource.run(file, title, lang);
    const sourceId = Number(db.lastInsertRowid);
    const content = fs.readFileSync(file, 'utf8');
    let idx = 0;
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      insertChunk.run(sourceId, idx, content.slice(i, i + CHUNK_SIZE), now);
      idx++;
      totalChunks++;
    }
    totalFiles++;
  }

  console.log(`[knowledge.db] Populated: ${totalFiles} files, ${totalChunks} chunks`);
  console.log('[knowledge.db] Sources:', db.prepare('SELECT COUNT(*) as c FROM sources').get().c);
  console.log('[knowledge.db] Chunks:', db.prepare('SELECT COUNT(*) as c FROM chunks').get().c);
  console.log('[knowledge.db] Size (KB):', Math.round(fs.statSync(KB_DB).size / 1024));
  db.close();
}

main();
