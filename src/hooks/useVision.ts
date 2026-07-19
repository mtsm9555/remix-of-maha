import { useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { visionService, type VisionResult } from "@/services/vision";
import { analyzeImage } from "@/lib/mahaCommand.functions";

export function useVision() {
  const [image, setImage] = useState<VisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyze = useServerFn(analyzeImage);

  const uploadImage = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const result = await visionService.processImage(file);
        setImage({ ...result, analysis: "Analyzing…" });
        const { analysis } = await analyze({
          data: {
            imageBase64: result.base64,
            mimeType: result.mimeType,
            prompt: "Describe this image in 2-3 sentences. List the key objects.",
          },
        });
        setImage({ ...result, analysis });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Vision failed");
        setImage((prev) => (prev ? { ...prev, analysis: undefined } : prev));
      } finally {
        setLoading(false);
      }
    },
    [analyze],
  );

  const reset = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return { image, loading, error, uploadImage, reset };
}