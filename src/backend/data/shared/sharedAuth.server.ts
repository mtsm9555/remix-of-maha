import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AccessLevel } from "./SharedMemoryTypes";

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("has_role" as any, {
    _user_id: userId,
    _role: "admin",
  });
  if (error) return false;
  return Boolean(data);
}

export async function getUserClearance(userId: string): Promise<AccessLevel> {
  const { data, error } = await supabaseAdmin.rpc("get_user_clearance" as any, {
    _user_id: userId,
  });
  if (error || !data) return "internal";
  return data as AccessLevel;
}