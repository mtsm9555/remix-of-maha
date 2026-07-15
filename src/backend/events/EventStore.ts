import type { AgentEvent } from "./types";

export class EventStore {
  /**
   * Persists an event to the database for observability.
   * Requires an `event_logs` table.
   */
  static async logEvent(event: AgentEvent) {
    try {
      if (typeof window !== "undefined") return;
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("event_logs" as any).insert({
        id: event.id,
        type: event.type,
        channel: event.channel,
        payload: event.payload,
        correlation_id: event.correlationId,
        source_agent: event.sourceAgent,
        created_at: event.timestamp.toISOString(),
      });
      if (error) console.error("[EventStore] Failed to log event:", error);
    } catch (err) {
      console.error("[EventStore] Critical DB failure:", err);
    }
  }

  /**
   * EVENT REPLAY: Fetches all events for a specific correlation ID.
   */
  static async getEventsByCorrelation(correlationId: string): Promise<AgentEvent[]> {
    if (typeof window !== "undefined") return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("event_logs" as any)
      .select("*")
      .eq("correlation_id", correlationId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return (data as any[]).map((row) => ({
      id: row.id,
      type: row.type,
      channel: row.channel,
      payload: row.payload,
      correlationId: row.correlation_id,
      sourceAgent: row.source_agent,
      timestamp: new Date(row.created_at),
    }));
  }
}