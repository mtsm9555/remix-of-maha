/**
 * Shared error helpers used across server functions, streaming routes,
 * and the client UI. Central place to normalize gateway/network failures
 * into a small set of user-facing messages.
 */

export type MahaErrorCode =
  | "rate_limited"
  | "payment_required"
  | "unauthorized"
  | "bad_request"
  | "not_found"
  | "server_error"
  | "network_error"
  | "aborted"
  | "unknown";

export class MahaError extends Error {
  code: MahaErrorCode;
  status?: number;
  cause?: unknown;
  constructor(code: MahaErrorCode, message: string, opts?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = "MahaError";
    this.code = code;
    this.status = opts?.status;
    this.cause = opts?.cause;
  }
}

export function mapGatewayStatus(status: number, body?: string): MahaError {
  const detail = body?.slice(0, 300);
  switch (status) {
    case 401:
    case 403:
      return new MahaError("unauthorized", "Authentication with AI gateway failed.", { status });
    case 402:
      return new MahaError(
        "payment_required",
        "AI credits are exhausted. Add credits in workspace billing to continue.",
        { status },
      );
    case 429:
      return new MahaError(
        "rate_limited",
        "Too many requests. Please wait a moment and try again.",
        { status },
      );
    case 400:
      return new MahaError("bad_request", detail || "The request was invalid.", { status });
    case 404:
      return new MahaError("not_found", "The requested resource was not found.", { status });
    default:
      if (status >= 500) {
        return new MahaError("server_error", "The AI service is temporarily unavailable.", { status });
      }
      return new MahaError("unknown", detail || `Request failed (${status}).`, { status });
  }
}

export function toUserMessage(err: unknown): string {
  if (err instanceof MahaError) return err.message;
  if (err instanceof DOMException && err.name === "AbortError") return "Request was cancelled.";
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    return "Network error. Check your connection and try again.";
  }
  if (err instanceof Error) return err.message || "Something went wrong.";
  return "Something went wrong.";
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/** Wrap a server-function handler to normalize thrown errors into MahaError. */
export async function safeHandler<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof MahaError) throw err;
    console.error(`[${label}] handler error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    // Detect common upstream status leaks
    const m = /\b(4\d\d|5\d\d)\b/.exec(msg);
    if (m) throw mapGatewayStatus(Number(m[1]), msg);
    throw new MahaError("server_error", msg || `${label} failed.`, { cause: err });
  }
}

/** JSON response builder for server routes. */
export function errorResponse(err: unknown, fallbackStatus = 500): Response {
  const e =
    err instanceof MahaError
      ? err
      : new MahaError("server_error", toUserMessage(err), { cause: err });
  const status = e.status ?? statusForCode(e.code, fallbackStatus);
  return new Response(
    JSON.stringify({ error: { code: e.code, message: e.message } }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function statusForCode(code: MahaErrorCode, fallback: number): number {
  switch (code) {
    case "rate_limited": return 429;
    case "payment_required": return 402;
    case "unauthorized": return 401;
    case "bad_request": return 400;
    case "not_found": return 404;
    case "server_error": return 500;
    default: return fallback;
  }
}