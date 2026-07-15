export class QwenVLClient {
  constructor(private endpoint = import.meta.env.VITE_QWEN_VL_URL as string | undefined) {}

  async analyze(imageUrl: string, prompt: string): Promise<unknown> {
    if (!this.endpoint) return { summary: "", imageUrl, prompt };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, prompt }),
    });
    if (!res.ok) throw new Error(`Qwen-VL failed: ${res.status}`);
    return res.json();
  }
}