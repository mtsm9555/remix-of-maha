export class AuditLogger {
  async record(actor: string, action: string, details: unknown) {
    console.log({ actor, action, details, timestamp: new Date() });
  }
}

export const audit = new AuditLogger();