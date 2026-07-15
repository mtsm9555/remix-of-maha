export class VoiceSession {
  transcript = "";
  startedAt = new Date();
  lastActivity = new Date();

  constructor(public sessionId: string, public userId: string) {}

  update(text: string) {
    this.transcript += text;
    this.lastActivity = new Date();
  }
}