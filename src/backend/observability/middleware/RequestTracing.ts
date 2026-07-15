export function requestTracing(req: any, res: any, next: () => void) {
  req.traceId = crypto.randomUUID();
  res.setHeader?.("x-trace-id", req.traceId);
  next();
}