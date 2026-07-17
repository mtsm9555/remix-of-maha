import type { MemberInvite, OrganizationMember } from "./OrganizationTypes";

export class MemberManager {
  static async inviteMember(
    tenantId: string,
    email: string,
    role: string,
    teamIds: string[],
    invitedBy: string,
  ): Promise<MemberInvite> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("organization_members" as never)
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .maybeSingle();
    if (existing) throw new Error("User is already a member of this organization");

    const { data: pending } = await supabaseAdmin
      .from("member_invites" as never)
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();
    if (pending) throw new Error("An invite is already pending for this email");

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const id = `inv_${crypto.randomUUID()}`;

    const { error } = await supabaseAdmin.from("member_invites" as never).insert({
      id,
      tenant_id: tenantId,
      email,
      role,
      team_ids: teamIds,
      status: "pending",
      invited_by: invitedBy,
      token,
      expires_at: expiresAt.toISOString(),
    } as never);
    if (error) throw new Error(error.message);

    return {
      id, tenantId, email, role, teamIds, status: "pending",
      invitedBy, token, expiresAt, createdAt: new Date(),
    };
  }

  static async acceptInvite(token: string, userId: string): Promise<OrganizationMember> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin
      .from("member_invites" as never)
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();
    if (error || !invite) throw new Error("Invalid or expired invite token");
    const inv = invite as {
      id: string; tenant_id: string; email: string; role: string;
      team_ids: string[] | null; expires_at: string;
    };
    if (new Date() > new Date(inv.expires_at)) {
      await supabaseAdmin.from("member_invites" as never).update({ status: "expired" } as never).eq("id", inv.id);
      throw new Error("Invite has expired");
    }

    const memberId = `mem_${crypto.randomUUID()}`;
    const { error: insErr } = await supabaseAdmin.from("organization_members" as never).insert({
      id: memberId,
      tenant_id: inv.tenant_id,
      user_id: userId,
      email: inv.email,
      role: inv.role,
      status: "active",
      team_ids: inv.team_ids ?? [],
    } as never);
    if (insErr) throw new Error(insErr.message);

    await supabaseAdmin
      .from("member_invites" as never)
      .update({ status: "accepted", accepted_at: new Date().toISOString() } as never)
      .eq("id", inv.id);

    // Mirror to tenant_members
    await supabaseAdmin.from("tenant_members" as never).insert({
      tenant_id: inv.tenant_id, user_id: userId, role: inv.role,
    } as never);

    return {
      id: memberId, tenantId: inv.tenant_id, userId, email: inv.email,
      displayName: "", role: inv.role, status: "active",
      teamIds: inv.team_ids ?? [], joinedAt: new Date(), metadata: {},
    };
  }

  static async changeMemberRole(tenantId: string, memberId: string, newRole: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin
      .from("organization_roles" as never)
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", newRole)
      .maybeSingle();
    if (!role) throw new Error("Role does not exist");
    await supabaseAdmin
      .from("organization_members" as never)
      .update({ role: newRole } as never)
      .eq("id", memberId)
      .eq("tenant_id", tenantId);
  }

  static async removeMember(tenantId: string, memberId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin
      .from("organization_members" as never)
      .select("user_id, role")
      .eq("id", memberId)
      .eq("tenant_id", tenantId)
      .single();
    if (!member) throw new Error("Member not found");
    const m = member as { user_id: string; role: string };
    if (m.role === "owner") {
      const { count } = await supabaseAdmin
        .from("organization_members" as never)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("role", "owner");
      if (count === 1) throw new Error("Cannot remove the last owner");
    }
    await supabaseAdmin.from("organization_members" as never).delete().eq("id", memberId);
    await supabaseAdmin
      .from("tenant_members" as never)
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", m.user_id);
  }

  static async getMembers(tenantId: string): Promise<OrganizationMember[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("organization_members" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("joined_at", { ascending: false });
    return ((data ?? []) as unknown as OrganizationMember[]);
  }
}