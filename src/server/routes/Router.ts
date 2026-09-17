import { IncomingMessage, ServerResponse } from 'node:http';

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  pathname: string;
  method: string;
  clientIp: string;
  userAgent: string;
  query: URLSearchParams;
  sendJson: (status: number, data: any) => void;
  sendText: (status: number, text: string) => void;
  parseJsonBody: () => Promise<any>;
}

export type RouteHandler = (ctx: RouteContext) => Promise<void> | void;

export interface Route {
  method: string;
  pattern: string | RegExp;
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];

  public add(method: string, path: string, handler: RouteHandler): this {
    this.routes.push({ method: method.toUpperCase(), pattern: path, handler });
    return this;
  }

  public get(path: string, handler: RouteHandler): this { return this.add('GET', path, handler); }
  public post(path: string, handler: RouteHandler): this { return this.add('POST', path, handler); }
  public put(path: string, handler: RouteHandler): this { return this.add('PUT', path, handler); }
  public delete(path: string, handler: RouteHandler): this { return this.add('DELETE', path, handler); }

  public match(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;

      if (typeof route.pattern === 'string') {
        if (route.pattern === pathname) {
          return { route, params: {} };
        }
        const paramMatch = this.matchParams(route.pattern, pathname);
        if (paramMatch) return { route, params: paramMatch };
      }
    }
    return null;
  }

  private matchParams(pattern: string, pathname: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');
    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}

export function createRouteContext(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  parsedUrl: URL,
  helpers: {
    sendJson: (status: number, data: any) => void;
    sendText: (status: number, text: string) => void;
    parseJsonBody: () => Promise<any>;
  }
): RouteContext {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  return {
    req,
    res,
    pathname,
    method: req.method || 'GET',
    clientIp,
    userAgent,
    query: parsedUrl.searchParams,
    ...helpers,
  };
}

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (ctx) => {
    try {
      await handler(ctx);
    } catch (err: any) {
      const { logger, LogCategory } = await import('../../core/Logger.js');
      logger.error(LogCategory.HTTP, 'ROUTE_ERROR', `${ctx.method} ${ctx.pathname}: ${err.message}`);
      if (!ctx.res.headersSent) {
        ctx.sendJson(500, { error: err.message || 'Internal server error' });
      }
    }
  };
}
