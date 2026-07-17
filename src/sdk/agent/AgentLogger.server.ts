import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AgentLogger } from "./AgentSDKTypes";

export class AgentLoggerImpl implements AgentLogger {
  constructor(private agentId: string, private tenantId: string) {}

  info(message: string, metadata?: any): void { void this.log('info', message, metadata); }
  warn(message: string, metadata?: any): void { void this.log('warn', message, metadata); }
  error(message: string, metadata?: any): void { void this.log('error', message, metadata); }
  debug(message: string, metadata?: any): void { void this.log('debug', message, metadata); }

  private async log(level: string, message: string, metadata?: any): Promise<void> {
    console.log(`[Agent:${this.agentId}] [${level.toUpperCase()}] ${message}`, metadata || '');
    try {
      await supabaseAdmin.from('agent_logs').insert({
        id: `log_${crypto.randomUUID()}`,
        agent_id: this.agentId,
        tenant_id: this.tenantId,
        level,
        message,
        metadata: metadata ?? {},
      });
    } catch (err) {
      console.error('[AgentLogger] persist failed', err);
    }
  }
}