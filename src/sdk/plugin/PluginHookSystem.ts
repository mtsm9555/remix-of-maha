import type { PluginHookSystem, PluginHookHandler, HookType } from "./PluginSDKTypes";

interface HookRegistration {
  handler: PluginHookHandler;
  type: HookType;
}

export class PluginHookSystemImpl implements PluginHookSystem {
  private hooks: Map<string, HookRegistration[]> = new Map();

  register(hookName: string, handler: PluginHookHandler, type: HookType = 'after'): void {
    if (!this.hooks.has(hookName)) this.hooks.set(hookName, []);
    this.hooks.get(hookName)!.push({ handler, type });
  }

  unregister(hookName: string, handler: PluginHookHandler): void {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return;
    const i = hooks.findIndex((h) => h.handler === handler);
    if (i !== -1) hooks.splice(i, 1);
  }

  async execute(hookName: string, data: any): Promise<any> {
    const hooks = this.hooks.get(hookName) || [];
    const order: Record<HookType, number> = { before: 0, around: 1, after: 2, filter: 3 };
    const sorted = [...hooks].sort((a, b) => order[a.type] - order[b.type]);
    let result = data;
    for (const hook of sorted) {
      try {
        if (hook.type === 'before' || hook.type === 'after') {
          await hook.handler(result);
        } else if (hook.type === 'around') {
          result = await hook.handler(result, () => result);
        } else if (hook.type === 'filter') {
          result = await hook.handler(result);
        }
      } catch (e) {
        console.error(`[HookSystem] ${hookName}:`, e);
      }
    }
    return result;
  }
}