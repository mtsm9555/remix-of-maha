export type RealtimeState = "disconnected" | "connecting" | "connected";

type Listener = (payload?: unknown) => void;

class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners: Record<string, Listener[]> = {};
  state: RealtimeState = "disconnected";

  connect(url?: string) {
    if (this.socket) return;
    const target =
      url ??
      (typeof import.meta !== "undefined"
        ? (import.meta.env.VITE_REALTIME_URL as string | undefined)
        : undefined);
    if (!target) return;
    this.state = "connecting";
    try {
      this.socket = new WebSocket(target);
    } catch (err) {
      console.error("Realtime connect failed", err);
      this.state = "disconnected";
      return;
    }
    this.socket.onopen = () => {
      this.state = "connected";
      this.emit("connected");
    };
    this.socket.onmessage = (event) => {
      try {
        this.emit("message", JSON.parse(event.data));
      } catch {
        this.emit("message", event.data);
      }
    };
    this.socket.onclose = () => {
      this.state = "disconnected";
      this.socket = null;
      this.emit("disconnected");
    };
    this.socket.onerror = (err) => this.emit("error", err);
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }

  send(data: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  on(event: string, callback: Listener) {
    (this.listeners[event] ||= []).push(callback);
    return () => {
      this.listeners[event] = (this.listeners[event] || []).filter((fn) => fn !== callback);
    };
  }

  private emit(event: string, payload?: unknown) {
    this.listeners[event]?.forEach((fn) => fn(payload));
  }
}

export const realtime = new RealtimeClient();