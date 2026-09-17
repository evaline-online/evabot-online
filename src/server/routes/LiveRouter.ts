import { Router, withErrorHandling } from './Router.js';
import { logger } from '../../core/Logger.js';

/**
 * Live activity stream — powers evabot.online/live and live.evabot.online.
 *
 * A tiny fan-out bus: producers POST /api/live/event, every connected
 * browser receives the event over SSE (/api/live/stream). The viewer is
 * read-only; writes are restricted to localhost or a matching x-live-token.
 */

export interface LiveEvent {
  ts: number;
  text: string;
  cls: string;
  agent: string;
}

type Client = (chunk: string) => void;

const MAX_HISTORY = 500;

export class LiveRouter extends Router {
  private static history: LiveEvent[] = [];
  private static clients = new Set<Client>();

  public static publish(input: { text: string; cls?: string; agent?: string }): LiveEvent {
    const ev: LiveEvent = {
      ts: Date.now(),
      text: String(input.text ?? '').slice(0, 8000),
      cls: String(input.cls ?? 'bot').slice(0, 16),
      agent: String(input.agent ?? 'eva').slice(0, 32),
    };
    LiveRouter.history.push(ev);
    if (LiveRouter.history.length > MAX_HISTORY) {
      LiveRouter.history.splice(0, LiveRouter.history.length - MAX_HISTORY);
    }
    const payload = `data: ${JSON.stringify(ev)}\n\n`;
    for (const client of LiveRouter.clients) {
      try {
        client(payload);
      } catch {
        /* dropped below */
      }
    }
    return ev;
  }

  private static isLocal(ip: string): boolean {
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  }

  constructor() {
    super();

    this.get(
      '/api/live/stream',
      withErrorHandling(async (ctx) => {
        ctx.res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Access-Control-Allow-Origin': '*',
        });

        const send: Client = (chunk) => {
          try {
            ctx.res.write(chunk);
          } catch {
            LiveRouter.clients.delete(send);
          }
        };

        for (const ev of LiveRouter.history) {
          send(`data: ${JSON.stringify(ev)}\n\n`);
        }
        send(`event: ready\ndata: ${JSON.stringify({ count: LiveRouter.history.length })}\n\n`);

        LiveRouter.clients.add(send);
        logger.info('LiveRouter', `viewer connected (${LiveRouter.clients.size} online)`);

        const heartbeat = setInterval(() => send(': ping\n\n'), 15000);
        ctx.req.on('close', () => {
          clearInterval(heartbeat);
          LiveRouter.clients.delete(send);
        });
      }),
    );

    this.post(
      '/api/live/event',
      withErrorHandling(async (ctx) => {
        const token = process.env.LIVE_TOKEN || '';
        const provided = String(ctx.req.headers['x-live-token'] || '');
        const allowed = token ? provided === token : LiveRouter.isLocal(ctx.clientIp);
        if (!allowed) {
          ctx.sendJson(403, { error: 'forbidden' });
          return;
        }

        const body = await ctx.parseJsonBody();
        const text = String(body?.text ?? '').trim();
        if (!text) {
          ctx.sendJson(400, { error: 'Missing or invalid "text" parameter' });
          return;
        }

        const ev = LiveRouter.publish({ text, cls: body?.cls, agent: body?.agent });
        ctx.sendJson(200, { ok: true, ts: ev.ts, count: LiveRouter.history.length });
      }),
    );

    this.get(
      '/api/live/state',
      withErrorHandling(async (ctx) => {
        ctx.sendJson(200, {
          events: LiveRouter.history.length,
          viewers: LiveRouter.clients.size,
          last: LiveRouter.history[LiveRouter.history.length - 1] ?? null,
        });
      }),
    );
  }
}
