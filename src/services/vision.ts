export interface VisionResult {
  id: string;
  filename: string;
  imageUrl: string;
  timestamp: number;
  analysis?: string;
  mimeType: string;
  base64: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export class VisionService {
  async processImage(file: File): Promise<VisionResult> {
    const base64 = await fileToBase64(file);
    return {
      id: crypto.randomUUID(),
      filename: file.name,
      imageUrl: URL.createObjectURL(file),
      timestamp: Date.now(),
      mimeType: file.type || "image/png",
      base64,
    };
  }
}

export const visionService = new VisionService();