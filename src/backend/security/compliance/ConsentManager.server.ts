import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class ConsentManager {
  static async recordConsent(
    tenantId: string,
    userId: string,
    purpose: string,
    granted: boolean,
    options: { ipAddress?: string; userAgent?: string; consentText?: string; expiresAt?: Date } = {},
  ) {
    const now = new Date();
    const consent = {
      id: `consent_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      user_id: userId,
      purpose,
      granted,
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      consent_text: options.consentText,
      granted_at: now.toISOString(),
      expires_at: options.expiresAt?.toISOString(),
    };
    await supabaseAdmin.from("consent_records").insert(consent);
    return consent;
  }

  static async withdrawConsent(consentId: string, tenantId: string, userId: string, withdrawnBy: string) {
    await supabaseAdmin
      .from("consent_records")
      .update({ withdrawn_at: new Date().toISOString(), withdrawn_by: withdrawnBy })
      .eq("id", consentId)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId);
  }

  static async hasConsent(tenantId: string, userId: string, purpose: string) {
    const { data } = await supabaseAdmin
      .from("consent_records")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("purpose", purpose)
      .eq("granted", true)
      .is("withdrawn_at", null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();
    return !!data;
  }

  static async listConsents(tenantId: string, userId?: string) {
    let q = supabaseAdmin.from("consent_records").select("*").eq("tenant_id", tenantId);
    if (userId) q = q.eq("user_id", userId);
    const { data } = await q.order("granted_at", { ascending: false });
    return data ?? [];
  }
}