/**
 * LearnedLessons.ts — Experience Store / Continuous Learning for EvaBot.
 *
 * Persists and retrieves learned rules, user corrections, and system insights
 * from SQLite (/var/www/evabot-backend/data/chat-history.db).
 *
 * Injected dynamically into SystemContext so that every channel (Telegram Bot,
 * MTProto Userbot, Web API, Terminal CLI) immediately reflects learned behavior.
 */

import { DatabaseSync } from 'node:sqlite';
import { logger, LogCategory } from './Logger.js';

export interface LessonRecord {
  id: number;
  category: string;
  triggerPattern: string | null;
  lesson: string;
  source: string;
  createdAt: number;
  appliedCount: number;
}

const DB_PATH = '/var/www/evabot-backend/data/chat-history.db';

export class LearnedLessons {
  private static db: DatabaseSync | null = null;

  private static getDb(): DatabaseSync | null {
    if (this.db) return this.db;
    try {
      this.db = new DatabaseSync(DB_PATH);
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS learned_lessons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL DEFAULT 'general',
          trigger_pattern TEXT,
          lesson TEXT NOT NULL,
          source TEXT NOT NULL DEFAULT 'user_feedback',
          created_at INTEGER NOT NULL,
          applied_count INTEGER NOT NULL DEFAULT 0
        );
      `);
      return this.db;
    } catch (err: any) {
      logger.warn(LogCategory.SYSTEM, `LearnedLessons: failed to open SQLite db: ${err?.message || err}`);
      return null;
    }
  }

  public static getTopLessons(limit = 5): LessonRecord[] {
    const db = this.getDb();
    if (!db) return [];
    try {
      const stmt = db.prepare(`
        SELECT id, category, trigger_pattern as triggerPattern, lesson, source, created_at as createdAt, applied_count as appliedCount
        FROM learned_lessons
        ORDER BY id DESC
        LIMIT ?
      `);
      const rows = stmt.all(limit) as any[];
      return rows.map(r => ({
        id: Number(r.id),
        category: String(r.category),
        triggerPattern: r.triggerPattern ? String(r.triggerPattern) : null,
        lesson: String(r.lesson),
        source: String(r.source),
        createdAt: Number(r.createdAt),
        appliedCount: Number(r.appliedCount || 0)
      }));
    } catch (err: any) {
      logger.warn(LogCategory.SYSTEM, `LearnedLessons: query failed: ${err?.message || err}`);
      return [];
    }
  }

  public static addLesson(lesson: string, category = 'general', source = 'user'): boolean {
    const trimmed = lesson.trim();
    if (!trimmed) return false;
    const db = this.getDb();
    if (!db) return false;
    try {
      const stmt = db.prepare(`
        INSERT INTO learned_lessons (category, lesson, source, created_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(category, trimmed, source, Date.now());
      logger.info(LogCategory.SYSTEM, `LearnedLessons: added new lesson: "${trimmed.slice(0, 60)}..."`);
      return true;
    } catch (err: any) {
      logger.error(LogCategory.SYSTEM, `LearnedLessons: insert failed: ${err?.message || err}`);
      return false;
    }
  }

  public static formatForPrompt(lang: string = 'uk', limit = 5): string {
    const lessons = this.getTopLessons(limit);
    if (lessons.length === 0) return '';

    const header = lang === 'ru'
      ? '[ВЫУЧЕННЫЕ ПРАВИЛА И ОПЫТ СИСТЕМЫ]:'
      : lang === 'en'
      ? '[LEARNED LESSONS & EXPERIENCE RULES]:'
      : '[ЗАСВОЄНІ ПРАВИЛА ТА ДОСВІД СИСТЕМИ]:';

    const items = lessons.map((l, idx) => `${idx + 1}. ${l.lesson}`).join('\n');
    return `${header}\n${items}`;
  }
}
