export class SessionManager {
  private sessions = new Map<string, any>();

  create(sessionId: string, page: any) {
    this.sessions.set(sessionId, page);
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  destroy(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}