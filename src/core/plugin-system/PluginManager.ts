import { Plugin, PluginContext, PluginManifest, PluginError, PluginEventBus } from './types.js';
import { logger, LogCategory } from '../Logger.js';

interface LoadedPlugin {
  plugin: Plugin;
  status: 'loaded' | 'initializing' | 'active' | 'shutdown' | 'failed' | 'disabled';
  error?: string;
  loadedAt: Date;
  manifest: PluginManifest;
}

export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, LoadedPlugin> = new Map();
  private eventBus: PluginEventBus = new PluginEventBus();
  private routes: Array<{ method: string; path: string; handler: (...args: unknown[]) => unknown; pluginId: string }> = [];
  private commands: Map<string, { handler: (...args: unknown[]) => unknown; help?: string; pluginId: string }> = new Map();

  private constructor() {}

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  public static resetInstance(): void {
    PluginManager.instance = null!;
  }

  public async register(plugin: Plugin): Promise<void> {
    const id = plugin.manifest.id;

    if (this.plugins.has(id)) {
      throw new PluginError(id, 'Plugin already registered');
    }

    if (plugin.manifest.dependencies) {
      for (const dep of plugin.manifest.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new PluginError(id, `Missing dependency: ${dep}`);
        }
      }
    }

    this.plugins.set(id, {
      plugin,
      status: 'initializing',
      loadedAt: new Date(),
      manifest: plugin.manifest,
    });

    try {
      const context: PluginContext = {
        config: this.getPluginConfig(id),
        logger: this.createPluginLogger(id),
        eventBus: this.eventBus,
        registerRoute: (method, path, handler) => {
          this.routes.push({ method, path, handler: handler as (...args: unknown[]) => unknown, pluginId: id });
        },
        registerCommand: (command, handler, help) => {
          this.commands.set(command, { handler: handler as (...args: unknown[]) => unknown, help, pluginId: id });
        },
        getStorage: () => null,
      };

      await plugin.initialize(context);

      const loaded = this.plugins.get(id)!;
      loaded.status = plugin.manifest.enabled ? 'active' : 'disabled';

      logger.info(LogCategory.SYSTEM, 'PluginManager', `Plugin registered: ${id} v${plugin.manifest.version}`);
    } catch (err: unknown) {
      const loaded = this.plugins.get(id)!;
      loaded.status = 'failed';
      const message = err instanceof Error ? err.message : String(err);
      loaded.error = message;
      throw new PluginError(id, `Failed to initialize: ${message}`, err instanceof Error ? err : undefined);
    }
  }

  public async enable(pluginId: string): Promise<void> {
    const loaded = this.plugins.get(pluginId);
    if (!loaded) throw new PluginError(pluginId, 'Plugin not found');
    if (loaded.status === 'active') return;

    loaded.manifest.enabled = true;
    loaded.status = 'active';
    logger.info(LogCategory.SYSTEM, 'PluginManager', `Plugin enabled: ${pluginId}`);
  }

  public async disable(pluginId: string): Promise<void> {
    const loaded = this.plugins.get(pluginId);
    if (!loaded) throw new PluginError(pluginId, 'Plugin not found');
    if (loaded.status === 'disabled') return;

    loaded.manifest.enabled = false;
    loaded.status = 'disabled';
    logger.info(LogCategory.SYSTEM, 'PluginManager', `Plugin disabled: ${pluginId}`);
  }

  public async shutdown(pluginId: string): Promise<void> {
    const loaded = this.plugins.get(pluginId);
    if (!loaded) return;

    try {
      await loaded.plugin.shutdown();
      loaded.status = 'shutdown';
      logger.info(LogCategory.SYSTEM, 'PluginManager', `Plugin shut down: ${pluginId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(LogCategory.SYSTEM, 'PluginManager', `Shutdown error for ${pluginId}: ${message}`);
    }
  }

  public async shutdownAll(): Promise<void> {
    for (const id of this.plugins.keys()) {
      await this.shutdown(id);
    }
  }

  public get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  public list(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => ({
      ...p.manifest,
      enabled: p.status === 'active',
    }));
  }

  public getStatus(pluginId: string): string | undefined {
    return this.plugins.get(pluginId)?.status;
  }

  public getRoutes(): Array<{ method: string; path: string; handler: (...args: unknown[]) => unknown; pluginId: string }> {
    return this.routes.filter(r => {
      const loaded = this.plugins.get(r.pluginId);
      return loaded && loaded.status === 'active';
    });
  }

  public getAllPluginRoutes(): Array<{ method: string; path: string; handler: (body: unknown, query: unknown) => Promise<unknown> | unknown; pluginId: string }> {
    const result: Array<{ method: string; path: string; handler: (body: unknown, query: unknown) => Promise<unknown> | unknown; pluginId: string }> = [];
    for (const [id, loaded] of this.plugins) {
      if (loaded.status === 'active') {
        const plugin = loaded.plugin as Plugin & { routes?: Array<{ method: string; path: string; handler: (...args: unknown[]) => unknown }> };
        if (plugin.routes && Array.isArray(plugin.routes)) {
          for (const r of plugin.routes) {
            result.push({ method: r.method, path: r.path, handler: r.handler, pluginId: id });
          }
        }
      }
    }
    return result;
  }

  public getCommands(): Map<string, { handler: (...args: unknown[]) => unknown; help?: string; pluginId: string }> {
    return this.commands;
  }

  public getEventBus(): PluginEventBus {
    return this.eventBus;
  }

  public async healthCheckAll(): Promise<Record<string, { status: string; message?: string }>> {
    const results: Record<string, { status: string; message?: string }> = {};

    for (const [id, loaded] of this.plugins) {
      if (loaded.status === 'active' && loaded.plugin.healthCheck) {
        try {
          results[id] = await loaded.plugin.healthCheck();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          results[id] = { status: 'down', message };
        }
      } else {
        results[id] = { status: loaded.status };
      }
    }

    return results;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getPluginConfig(_pluginId: string): Record<string, unknown> {
    return {};
  }

  private createPluginLogger(pluginId: string) {
    return {
      info: (msg: string, meta?: unknown) => logger.info(LogCategory.SYSTEM, pluginId, msg, meta),
      warn: (msg: string, meta?: unknown) => logger.warn(LogCategory.SYSTEM, pluginId, msg, meta),
      error: (msg: string, meta?: unknown) => logger.error(LogCategory.SYSTEM, pluginId, msg, meta),
      debug: (msg: string, meta?: unknown) => logger.debug(LogCategory.SYSTEM, pluginId, msg, meta),
    };
  }
}

export const pluginManager = PluginManager.getInstance();
