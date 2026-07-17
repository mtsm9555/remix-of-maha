import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { WorkflowLogger } from "./WorkflowSDKTypes";

export class WorkflowLoggerImpl implements WorkflowLogger {
  constructor(private workflowId: string, private executionId: string, private tenantId: string) {}

  info(m: string, meta?: any) { void this.log('info', m, meta); }
  warn(m: string, meta?: any) { void this.log('warn', m, meta); }
  error(m: string, meta?: any) { void this.log('error', m, meta); }
  debug(m: string, meta?: any) { void this.log('debug', m, meta); }

  private async log(level: string, message: string, metadata?: any): Promise<void> {
    console.log(`[Workflow:${this.workflowId}] [${level.toUpperCase()}] ${message}`, metadata || '');
    try {
      await supabaseAdmin.from('workflow_logs').insert({
        id: `log_${crypto.randomUUID()}`,
        workflow_id: this.workflowId,
        execution_id: this.executionId,
        tenant_id: this.tenantId,
        level, message, metadata: metadata ?? {},
      });
    } catch (err) {
      console.error('[WorkflowLogger] persist failed', err);
    }
  }
}