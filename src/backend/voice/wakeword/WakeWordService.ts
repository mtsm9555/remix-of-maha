// TODO: swap for OpenWakeWord (server-side) integration.
// Browser-safe stub: matches "maha", "hey maha", "wakeup maha", "honny".
const WAKE_WORDS = ["hey maha", "wakeup maha", "maha", "honny"];

export class WakeWordService {
  async detect(input: Uint8Array | string): Promise<boolean> {
    if (typeof input !== "string") return true; // audio path: delegate upstream
    const text = input.toLowerCase().trim();
    return WAKE_WORDS.some((w) => text.includes(w));
  }
}