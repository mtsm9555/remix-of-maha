// src/backend/auth/AuthMiddleware.ts
import { AuthService } from "./AuthService";
import { AuthContext } from "./types";

export class AuthMiddleware {
  static async authenticate(request: Request): Promise<AuthContext | null> {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    return await AuthService.verifyToken(token);
  }

  static requireAuth(handler: (req: Request, auth: AuthContext) => Promise<Response>) {
    return async (request: Request): Promise<Response> => {
      const auth = await AuthMiddleware.authenticate(request);

      if (!auth) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      return handler(request, auth);
    };
  }
}