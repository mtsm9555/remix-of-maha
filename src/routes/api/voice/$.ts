// Voice API endpoints backed by src/backend/voice/qwen/VoiceRuntime.
//   POST /api/voice/session         → create session
//   GET  /api/voice/session/:id     → session info
//   DELETE /api/voice/session/:id   → end session
//   POST /api/voice/process         → multipart audio → transcript + response
//   POST /api/voice/stt             → multipart audio → transcript
//   POST /api/voice/tts             → { text } → audio data URL
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

async function handle(request: Request, splat: string | undefined): Promise<Response> {
  const { VoiceRuntime } = await import("@/backend/voice/qwen/VoiceRuntime");
  const { SpeechToText } = await import("@/backend/voice/qwen/SpeechToText");
  const { TextToSpeech } = await import("@/backend/voice/qwen/TextToSpeech");
  const method = request.method.toUpperCase();
  const p = parts(splat);

  // /api/voice/session
  if (p[0] === "session" && p.length === 1 && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId ?? "anonymous";
    const session = VoiceRuntime.createSession(userId);
    return json({ sessionId: session.id, wakeWordEnabled: session.wakeWordEnabled, startedAt: session.startedAt });
  }

  // /api/voice/session/:id
  if (p[0] === "session" && p.length === 2) {
    const id = p[1];
    if (method === "GET") {
      const s = VoiceRuntime.getSession(id);
      if (!s) return json({ error: "Session not found" }, 404);
      return json({ sessionId: s.id, isActive: s.isActive, messageCount: s.conversationHistory.length, history: s.conversationHistory });
    }
    if (method === "DELETE") {
      VoiceRuntime.endSession(id);
      return json({ success: true });
    }
  }

  // /api/voice/process
  if (p[0] === "process" && p.length === 1 && method === "POST") {
    const form = await request.formData();
    const audio = form.get("audio") as File | null;
    const sessionId = String(form.get("sessionId") ?? "");
    const language = (form.get("language") as string) || "en-US";
    const synthesize = form.get("synthesize") !== "false";
    if (!audio || !sessionId) return json({ error: "Missing audio or sessionId" }, 400);
    const buf = Buffer.from(new Uint8Array(await audio.arrayBuffer()));
    const result = await VoiceRuntime.processVoiceInput(sessionId, buf, {
      language: language as any,
      synthesizeResponse: synthesize,
    });
    return json({
      transcript: result.transcript,
      response: result.response,
      wakeWordDetected: result.wakeWordDetected,
      audioUrl: result.audioResponse ? `data:audio/mp3;base64,${result.audioResponse.toString("base64")}` : undefined,
    });
  }

  // /api/voice/stt
  if (p[0] === "stt" && p.length === 1 && method === "POST") {
    const form = await request.formData();
    const audio = form.get("audio") as File | null;
    const language = (form.get("language") as string) || "en-US";
    const format = ((form.get("format") as string) || "wav") as any;
    if (!audio) return json({ error: "Missing audio" }, 400);
    const buf = Buffer.from(new Uint8Array(await audio.arrayBuffer()));
    const r = await SpeechToText.transcribe({ audioBuffer: buf, format, language: language as any });
    return json({ text: r.text, confidence: r.confidence, language: r.language, duration: r.duration });
  }

  // /api/voice/tts
  if (p[0] === "tts" && p.length === 1 && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const text = body?.text;
    if (!text || typeof text !== "string") return json({ error: "Missing `text` string" }, 400);
    const r = await TextToSpeech.synthesize({ text, voice: body?.voice, format: body?.format ?? "mp3" });
    return json({
      audioUrl: `data:audio/mp3;base64,${r.audioBuffer.toString("base64")}`,
      duration: r.duration,
      voiceUsed: r.voiceUsed,
    });
  }

  return json({ error: "Not found" }, 404);
}

export const Route = createFileRoute("/api/voice/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, (params as any)._splat),
      POST: async ({ request, params }) => handle(request, (params as any)._splat),
      DELETE: async ({ request, params }) => handle(request, (params as any)._splat),
    },
  },
});