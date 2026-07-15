import { createServerFn } from "@tanstack/react-start";
import { requireUnlocked } from "./gate.server";

export const synthesizeVoice = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => {
    if (!input?.text || typeof input.text !== "string") throw new Error("text required");
    return { text: input.text.slice(0, 4000) };
  })
  .handler(async ({ data }) => {
    await requireUnlocked();
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("Voice service is not configured");

    const voiceId = "4tRn1lSkEn13EVTuqb0g";
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_turbo_v2_5",
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Voice synthesis failed: ${res.status} ${err}`);
    }

    const buf = await res.arrayBuffer();
    const audioBase64 = Buffer.from(buf).toString("base64");
    return { audioBase64, mimeType: "audio/mpeg" };
  });
