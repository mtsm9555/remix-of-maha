import type { DetectedObject } from "../types";

export class YOLOClient {
  constructor(private endpoint = import.meta.env.VITE_YOLO_URL as string | undefined) {}

  async detect(imageUrl: string): Promise<DetectedObject[]> {
    if (!this.endpoint) return [];
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_path: imageUrl }),
    });
    if (!res.ok) throw new Error(`YOLO failed: ${res.status}`);
    const data = (await res.json()) as { objects?: DetectedObject[] };
    return data.objects ?? [];
  }
}