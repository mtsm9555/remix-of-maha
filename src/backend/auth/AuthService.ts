// src/backend/auth/AuthService.ts
// NOTE: server-only. Do not import from client bundles.
import { createClient } from "@supabase/supabase-js";
import { User, AuthContext } from "./types";

function getAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export class AuthService {
  static async verifyToken(token: string): Promise<AuthContext | null> {
    try {
      const supabaseAdmin = getAdmin();
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        console.error("[AuthService] Token verification failed:", error);
        return null;
      }

      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .select("role, permissions")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile) {
        // Fall back to a default authenticated context if no profile row exists yet.
        return {
          userId: user.id,
          sessionId: crypto.randomUUID(),
          role: "user",
          permissions: [],
        };
      }

      return {
        userId: user.id,
        sessionId: crypto.randomUUID(),
        role: (userProfile as any).role ?? "user",
        permissions: (userProfile as any).permissions ?? [],
      };
    } catch (error) {
      console.error("[AuthService] Critical auth failure:", error);
      return null;
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    const supabaseAdmin = getAdmin();
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    return {
      id: (data as any).id,
      email: (data as any).email,
      role: (data as any).role,
      createdAt: new Date((data as any).created_at),
      preferences: (data as any).preferences,
    };
  }

  static async updatePreferences(userId: string, preferences: Record<string, any>) {
    const supabaseAdmin = getAdmin();
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ preferences })
      .eq("id", userId);

    if (error) throw new Error(`Failed to update preferences: ${error.message}`);
  }
}