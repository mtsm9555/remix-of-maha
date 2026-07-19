export {};

declare global {
  interface Window {
    mahaAPI?: {
      send(channel: string, data: unknown): void;
      receive(channel: string, callback: (data: unknown) => void): void;
      invoke(channel: string, data?: unknown): Promise<unknown>;
      platform: string;
    };
  }
}