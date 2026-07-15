import type { OCRResult } from "../types";

export class OCRService {
  constructor(private endpoint = import.meta.env.VITE_OCR_URL as string | undefined) {}

  async extractText(imageUrl: string): Promise<OCRResult> {
    if (!this.endpoint) return { text: "" };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });
    if (!res.ok) throw new Error(`OCR failed: ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "" };
  }
}