import type { PluginManifest, PluginContext, PluginLifecycle, PluginTool } from "./PluginSDKTypes";

export abstract class PluginBase implements PluginLifecycle {
  protected manifest: PluginManifest;
  protected context: PluginContext | null = null;

  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
  }

  async onInstall(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info(`Plugin ${this.manifest.name} installed`);
  }

  async onActivate(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info(`Plugin ${this.manifest.name} activated`);
  }

  async onDeactivate(context: PluginContext): Promise<void> {
    context.logger.info(`Plugin ${this.manifest.name} deactivated`);
  }

  async onUninstall(context: PluginContext): Promise<void> {
    context.logger.info(`Plugin ${this.manifest.name} uninstalled`);
  }

  async onUpdate(context: PluginContext, previousVersion: string): Promise<void> {
    context.logger.info(
      `Plugin ${this.manifest.name} updated from ${previousVersion} to ${this.manifest.version}`,
    );
  }

  getManifest(): PluginManifest {
    return this.manifest;
  }

  getContext(): PluginContext | null {
    return this.context;
  }

  async registerTools(): Promise<PluginTool[]> {
    return [];
  }

  async subscribeToEvents(): Promise<void> {}
  async registerHooks(): Promise<void> {}
}