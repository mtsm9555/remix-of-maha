import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PluginLogger } from "./PluginSDKTypes";

export class PluginLoggerImpl implements PluginLogger {
  constructor(private pluginId: string, private tenantId: string) {}

  info(message: string, metadata?: any): void { void this.log('info', message, metadata); }
  warn(message: string, metadata?: any): void { void this.log('warn', message, metadata); }
  error(message: string, metadata?: any): void { void this.log('error', message, metadata); }
  debug(message: string, metadata?: any): void { void this.log('debug', message, metadata); }

  private async log(level: string, message: string, metadata?: any): Promise<void> {
    console.log(`[Plugin:${this.pluginId}] [${level.toUpperCase()}] ${message}`, metadata || '');
    try {
      await supabaseAdmin.from('plugin_logs').insert({
        id: `log_${crypto.randomUUID()}`,
        plugin_id: this.pluginId,
        tenant_id: this.tenantId,
        level,
        message,
        metadata: metadata || {},
      });
    } catch (e) {
      console.error('[PluginLogger] failed to persist log:', e);
    }
  }
}