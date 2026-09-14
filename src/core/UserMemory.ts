import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { logger, LogCategory } from './Logger.js';

export interface User {
  id: number;
  session_id: string;
  name?: string;
  status?: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_query?: string;
  last_topic?: string;
  lang_pref?: string;
  model_pref?: string;
}

const DEFAULT_USER_MEMORY_DB = path.join(os.homedir(), '.mcp', 'user-memory.db');

export class UserMemory {
  private static instance: UserMemory | null = null;
  private db: DatabaseSync | null = null;
  private dbPath: string;
  private ready = false;

  private constructor(dbPath?: string) {
    this.dbPath = dbPath || DEFAULT_USER_MEMORY_DB;
    try {
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
      this.db = new DatabaseSync(this.dbPath);
      this.migrate();
      this.ready = true;
    } catch (err: unknown) {
      this.db = null;
      logger.warn(LogCategory.STORAGE, 'USER_MEMORY', `Store unavailable: ${String(err)}`);
    }
  }

  public static getInstance(dbPath?: string): UserMemory {
    const resolved = dbPath || DEFAULT_USER_MEMORY_DB;
    if (!UserMemory.instance) {
      UserMemory.instance = new UserMemory(resolved);
    }
    return UserMemory.instance;
  }

  private migrate(): void {
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        name TEXT,
        status TEXT,
        preferences TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        last_query TEXT,
        last_topic TEXT,
        lang_pref TEXT,
        model_pref TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_session_id ON users(session_id);
    `);
  }

  public isReady(): boolean {
    return this.ready;
  }

  public getUser(sessionId: string): User | null {
    if (!this.ready) return null;
    try {
      const row = this.db!.prepare('SELECT * FROM users WHERE session_id = ?').get(sessionId) as (User & { preferences: string }) | undefined;
      if (!row) return null;
      return { ...row, preferences: JSON.parse(row.preferences) };
    } catch {
      return null;
    }
  }

  public createUser(sessionId: string): User {
    if (!this.ready) throw new Error('UserMemory not ready');
    const now = new Date().toISOString();
    this.db!.prepare('INSERT OR IGNORE INTO users (session_id, created_at, updated_at) VALUES (?, ?, ?)').run(sessionId, now, now);
    return this.getUser(sessionId)!;
  }

  public updateUser(sessionId: string, data: Partial<User>): boolean {
    if (!this.ready) return false;
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
      if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
      if (data.preferences !== undefined) { updates.push('preferences = ?'); values.push(JSON.stringify(data.preferences)); }
      if (data.last_query !== undefined) { updates.push('last_query = ?'); values.push(data.last_query); }
      if (data.last_topic !== undefined) { updates.push('last_topic = ?'); values.push(data.last_topic); }
      if (data.lang_pref !== undefined) { updates.push('lang_pref = ?'); values.push(data.lang_pref); }
      if (data.model_pref !== undefined) { updates.push('model_pref = ?'); values.push(data.model_pref); }
      updates.push('updated_at = ?'); values.push(new Date().toISOString());
      if (updates.length === 1) return true;
      values.push(sessionId);
      this.db!.prepare(`UPDATE users SET ${updates.join(', ')} WHERE session_id = ?`).run(...values as import('node:sqlite').SQLInputValue[]);
      return true;
    } catch {
      return false;
    }
  }

  public incrementMessageCount(sessionId: string): boolean {
    if (!this.ready) return false;
    try {
      this.db!.prepare('UPDATE users SET message_count = message_count + 1, updated_at = ? WHERE session_id = ?').run(new Date().toISOString(), sessionId);
      return true;
    } catch {
      return false;
    }
  }

  public addQuery(sessionId: string, query: string): boolean {
    if (!this.ready) return false;
    try {
      this.db!.prepare('UPDATE users SET last_query = ?, updated_at = ? WHERE session_id = ?').run(query, new Date().toISOString(), sessionId);
      return true;
    } catch {
      return false;
    }
  }

  public addTopic(sessionId: string, topic: string): boolean {
    if (!this.ready) return false;
    try {
      this.db!.prepare('UPDATE users SET last_topic = ?, updated_at = ? WHERE session_id = ?').run(topic, new Date().toISOString(), sessionId);
      return true;
    } catch {
      return false;
    }
  }

  public getPreferences(sessionId: string): Record<string, unknown> {
    const user = this.getUser(sessionId);
    return user?.preferences || {};
  }

  public setPreference(sessionId: string, key: string, value: unknown): boolean {
    if (!this.ready) return false;
    try {
      const prefs = this.getPreferences(sessionId);
      prefs[key] = value;
      return this.updateUser(sessionId, { preferences: prefs });
    } catch {
      return false;
    }
  }

  public extractNameFromMessage(text: string): string | null {
    const patterns = [
      /меня зовут\s+([а-яёa-z\s-]+)/i,
      /my name is\s+([a-z\s-]+)/i,
      /я\s*[—-]\s*([а-яёa-z\s-]+)/i,
      /^я\s+([а-яёa-z\s-]+)\s*$/i,
      /name is\s+([a-z\s-]+)/i,
    ];
    for (const re of patterns) {
      const match = text.match(re);
      if (match && match[1]) {
        const name = match[1].trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return name;
      }
    }
    return null;
  }
}
