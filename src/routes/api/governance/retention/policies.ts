import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/governance/retention/policies")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { isAdmin } = await import(
          "@/backend/data/shared/sharedAuth.server"
        );
        if (!(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data } = await supabaseAdmin
          .from("retention_policies")
          .select("*");
        return Response.json({ policies: data ?? [] });
      },
    },
  },
});