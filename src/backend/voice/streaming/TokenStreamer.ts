export class TokenStreamer {
  private buffer = "";

  add(token: string) {
    this.buffer += token;
    const ready =
      this.buffer.endsWith(".") ||
      this.buffer.endsWith("?") ||
      this.buffer.endsWith("!");
    return { ready, text: this.buffer };
  }

  flush() {
    const text = this.buffer;
    this.buffer = "";
    return text;
  }

  clear() {
    this.buffer = "";
  }
}