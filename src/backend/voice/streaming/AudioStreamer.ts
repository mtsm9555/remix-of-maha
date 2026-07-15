type Listener = (chunk: Uint8Array) => void;

export class AudioStreamer {
  private listeners = new Set<Listener>();

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  push(chunk: Uint8Array) {
    for (const l of this.listeners) l(chunk);
  }

  clear() {
    this.listeners.clear();
  }
}