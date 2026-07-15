import type { OCRResult } from "../types";

export class PaddleOCRClient {
  constructor(private endpoint = import.meta.env.VITE_PADDLE_OCR_URL as string | undefined) {}

  async ocr(imageUrl: string): Promise<OCRResult> {
    if (!this.endpoint) return { text: "" };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_path: imageUrl }),
    });
    if (!res.ok) throw new Error(`PaddleOCR failed: ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "" };
  }
}