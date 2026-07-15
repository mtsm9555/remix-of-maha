export function errorTracking(err: any, req: any, _res: any, next: (err: any) => void) {
  console.error({ traceId: req?.traceId, error: err?.message ?? String(err) });
  next(err);
}