import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { transcribeAudio } from "@/lib/transcribe.functions";
import { sendChatMessage } from "@/lib/chat.functions";
import { synthesizeVoice } from "@/lib/tts.functions";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Voice Agent — Maha" },
      { name: "description", content: "Talk to Maha with your voice." },
    ],
  }),
  component: VoicePage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error.message}</p>
        <button className="mt-4 underline" onClick={() => { router.invalidate(); reset(); }}>
          Try again
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

type Status = "idle" | "recording" | "transcribing" | "thinking" | "speaking" | "error";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function VoicePage() {
  const transcribe = useServerFn(transcribeAudio);
  const sendChat = useServerFn(sendChatMessage);
  const speak = useServerFn(synthesizeVoice);

  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const pickMime = () => {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
    for (const c of candidates) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    return "";
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    setReply("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMime();
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await handleAudio(blob);
      };
      rec.start();
      recorderRef.current = rec;
      setStatus("recording");
    } catch (err) {
      setError((err as Error).message || "Microphone access denied");
      setStatus("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  const handleAudio = async (blob: Blob) => {
    try {
      if (blob.size < 1500) {
        setStatus("idle");
        setError("Recording was too short — try again.");
        return;
      }
      setStatus("transcribing");
      const audioBase64 = await blobToBase64(blob);
      const t = await transcribe({ data: { audioBase64, mimeType: blob.type || "audio/webm" } });
      const text = (t.text || "").trim();
      setTranscript(text);
      if (!text) { setStatus("idle"); setError("Didn't catch that."); return; }

      setStatus("thinking");
      const chat = await sendChat({ data: { conversationId, message: text } });
      setConversationId(chat.conversationId);
      setReply(chat.reply);

      setStatus("speaking");
      const tts = await speak({ data: { text: chat.reply } });
      const audio = new Audio(`data:${tts.mimeType};base64,${tts.audioBase64}`);
      audio.onended = () => setStatus("idle");
      audio.onerror = () => setStatus("idle");
      await audio.play();
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  const isRecording = status === "recording";
  const busy = status === "transcribing" || status === "thinking" || status === "speaking";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Back</Link>
          <h1 className="mt-2 text-3xl font-semibold">Voice Agent</h1>
          <p className="text-sm text-muted-foreground">Tap and speak. Maha listens, thinks, and speaks back.</p>
        </div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={busy}
          className={`h-32 w-32 rounded-full text-primary-foreground font-medium transition-all mx-auto flex items-center justify-center shadow-lg ${
            isRecording ? "bg-destructive animate-pulse" : busy ? "bg-muted text-muted-foreground" : "bg-primary hover:scale-105"
          }`}
        >
          {isRecording ? "Stop" : busy ? "…" : "Talk"}
        </button>

        <div className="text-sm text-muted-foreground capitalize">{status}</div>

        {transcript && (
          <div className="rounded-lg border bg-card p-4 text-left">
            <div className="text-xs uppercase text-muted-foreground mb-1">You said</div>
            <div>{transcript}</div>
          </div>
        )}
        {reply && (
          <div className="rounded-lg border bg-card p-4 text-left">
            <div className="text-xs uppercase text-muted-foreground mb-1">Maha</div>
            <div>{reply}</div>
          </div>
        )}
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
    </div>
  );
}