// Vision API endpoints backed by src/backend/vision/qwen/*.
//   POST /api/vision/process     multipart image + tasks=ocr,objects,understanding,screenshot
//   POST /api/vision/ocr         multipart image (+ provider)
//   POST /api/vision/detect      multipart image (+ provider)
//   POST /api/vision/understand  multipart image (+ provider)
//   POST /api/vision/screenshot  multipart screenshot
//   POST /api/vision/vqa         JSON { image (base64), question, provider? }
import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parts(splat: string | undefined): string[] {
  return (splat ?? "").split("/").filter(Boolean);
}

async function fileToImageInput(file: File) {
  const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
  const format = (file.name.split(".").pop()?.toLowerCase() || "jpeg") as any;
  return { buffer, format };
}

async function handle(request: Request, splat: string | undefined): Promise<Response> {
  const { VisionRuntime } = await import("@/backend/vision/qwen/VisionRuntime");
  const { OCRService } = await import("@/backend/vision/qwen/OCRService");
  const { ObjectDetectionService } = await import("@/backend/vision/qwen/ObjectDetectionService");
  const { ImageUnderstandingService } = await import("@/backend/vision/qwen/ImageUnderstandingService");
  const { ScreenshotAnalysisService } = await import("@/backend/vision/qwen/ScreenshotAnalysisService");

  if (request.method.toUpperCase() !== "POST") return json({ error: "Method not allowed" }, 405);
  const p = parts(splat);
  const endpoint = p[0];

  try {
    if (endpoint === "vqa") {
      const body = await request.json().catch(() => ({}));
      const { image, question, provider } = body ?? {};
      if (!image || !question) return json({ error: "Missing image or question" }, 400);
      const buffer = Buffer.from(String(image), "base64");
      const result = await ImageUnderstandingService.answerQuestion?.(
        { buffer, format: "jpeg" as any },
        question,
        provider,
      );
      return json(result ?? { error: "VQA not implemented" });
    }

    const form = await request.formData();
    const file = (form.get("image") ?? form.get("screenshot")) as File | null;
    if (!file) return json({ error: "Missing image file" }, 400);
    const img = await fileToImageInput(file);

    if (endpoint === "process") {
      const tasks = ((form.get("tasks") as string) || "understanding").split(",") as any;
      return json(await VisionRuntime.processImage(img, tasks));
    }
    if (endpoint === "ocr") {
      const provider = (form.get("provider") as string) || undefined;
      return json(await OCRService.extractText(img, provider as any));
    }
    if (endpoint === "detect") {
      const provider = (form.get("provider") as string) || undefined;
      return json(await ObjectDetectionService.detect(img, provider as any));
    }
    if (endpoint === "understand") {
      const provider = (form.get("provider") as string) || undefined;
      return json(await ImageUnderstandingService.understand(img, provider as any));
    }
    if (endpoint === "screenshot") {
      return json(await ScreenshotAnalysisService.analyze(img));
    }
    return json({ error: "Not found" }, 404);
  } catch (error: any) {
    return json({ error: error?.message ?? "Vision request failed" }, 500);
  }
}

export const Route = createFileRoute("/api/vision/$")({
  server: {
    handlers: {
      POST: async ({ request, params }) => handle(request, (params as any)._splat),
    },
  },
});