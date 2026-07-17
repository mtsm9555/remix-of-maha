import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class ApiKeyUsageTracker {
  static async recordUsage(
    apiKeyId: string,
    tenantId: string,
    endpoint: string,
    method: string,
    ipAddress: string,
    userAgent: string,
    responseStatus: number,
    responseTimeMs: number,
    errorMessage?: string,
  ) {
    await supabaseAdmin.from("api_key_usage_records").insert({
      api_key_id: apiKeyId,
      tenant_id: tenantId,
      endpoint, method,
      ip_address: ipAddress,
      user_agent: userAgent,
      response_status: responseStatus,
      response_time_ms: responseTimeMs,
      success: responseStatus >= 200 && responseStatus < 300,
      error_message: errorMessage ?? null,
    });
  }

  static async getAnalytics(apiKeyId: string, days = 30) {
    const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
    const { data } = await supabaseAdmin.from("api_key_usage_records")
      .select("*").eq("api_key_id", apiKeyId).gte("timestamp", cutoff)
      .order("timestamp", { ascending: false });

    const rows = data ?? [];
    if (rows.length === 0) return { totalRequests: 0, successRate: 0, avgResponseTime: 0, topEndpoints: [], topIps: [] };

    const total = rows.length;
    const success = rows.filter(r => r.success).length;
    const avg = rows.reduce((s, r) => s + r.response_time_ms, 0) / total;

    const bucket = (key: "endpoint" | "ip_address") => {
      const counts: Record<string, number> = {};
      rows.forEach(r => { counts[r[key]] = (counts[r[key]] ?? 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([k, count]) => ({ [key === "endpoint" ? "endpoint" : "ip"]: k, count }));
    };

    return {
      totalRequests: total,
      successfulRequests: success,
      failedRequests: total - success,
      successRate: success / total,
      avgResponseTime: avg,
      topEndpoints: bucket("endpoint"),
      topIps: bucket("ip_address"),
    };
  }

  static async getRecentUsage(apiKeyId: string, limit = 100) {
    const { data } = await supabaseAdmin.from("api_key_usage_records")
      .select("*").eq("api_key_id", apiKeyId)
      .order("timestamp", { ascending: false }).limit(limit);
    return data ?? [];
  }
}