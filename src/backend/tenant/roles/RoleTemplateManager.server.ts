import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AdvancedRoleManager } from "./AdvancedRoleManager.server";
import type { AdvancedRole, RoleTemplate } from "./AdvancedRoleTypes";

function mapTemplate(r: any): RoleTemplate {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    category: r.category,
    permissions: r.permissions ?? [],
    conditionalPermissions: r.conditional_permissions ?? [],
    isSystemTemplate: r.is_system_template ?? true,
  };
}

export class RoleTemplateManager {
  static async getTemplates(): Promise<RoleTemplate[]> {
    const { data } = await supabaseAdmin
      .from("advanced_role_templates" as any)
      .select("*")
      .order("category");
    return (data ?? []).map(mapTemplate);
  }

  static async createRoleFromTemplate(
    tenantId: string,
    templateId: string,
    customName: string | undefined,
    createdBy: string | null,
  ): Promise<AdvancedRole> {
    const { data: template, error } = await supabaseAdmin
      .from("advanced_role_templates" as any)
      .select("*")
      .eq("id", templateId)
      .single();
    if (error || !template) throw new Error("Template not found");
    const t = template as any;
    return AdvancedRoleManager.createRole(
      tenantId,
      customName ?? t.name,
      `Created from template: ${t.name}. ${t.description ?? ""}`,
      t.permissions ?? [],
      null,
      t.conditional_permissions ?? [],
      createdBy,
    );
  }
}