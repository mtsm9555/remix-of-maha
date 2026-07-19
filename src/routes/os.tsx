import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import "./os.css";
import BackgroundFX from "@/components/BackgroundFX";
import ParticleEngine from "@/components/ParticleEngine";
import AudioWaveform from "@/components/AudioWaveform";
import ReactorCore from "@/components/ReactorCore";
const ReactorScene = lazy(() => import("@/three/ReactorScene"));
import CircularWaveform from "@/components/CircularWaveform";
import CommandBar, { type CommandBarHandle } from "@/components/CommandBar";
import FloatingMenu from "@/components/FloatingMenu";
import StateTransition from "@/components/StateTransition";
import StreamingText from "@/components/StreamingText";
import { useMemory } from "@/hooks/useMemory";
import { transcribeMaha } from "@/lib/mahaCommand.functions";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";
import { useRealtime } from "@/hooks/useRealtime";
import { useAIState } from "@/hooks/useAIState";
import type { AIState } from "@/services/stateMachine";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "MAHA — AI Operating System" },
      { name: "description", content: "MAHA AI OS — voice-first neural interface." },
    ],
  }),
  component: OSPage,
});

type Mode = "idle" | "listening" | "thinking" | "speaking";

export function OSPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const { frequencyData, state: micState } = useMicrophone();
  const { isSpeaking, volume, speechStart, speechEnd } = useVoiceActivity();
  const {
    connected: realtimeConnected,
    response: realtimeResponse,
    waitingResponse,
    streamingResponse,
    receivingAudio,
  } = useRealtime();
  const derivedState = useAIState({
    isSpeaking,
    waitingResponse: waitingResponse || mode === "thinking",
    receivingAudio: receivingAudio || streamingResponse,
    analyzingImage: false,
    searchingMemory: false,
    executingTask: false,
  });
  const isDesktop = typeof window !== "undefined" && !!window.mahaAPI;
  const reactorState: AIState =
    mode === "speaking" ? "speaking" :
    mode === "listening" ? "listening" :
    derivedState === "idle" && micState !== "idle" ? (micState as AIState) : derivedState;

  useEffect(() => {
    if (speechEnd && mode === "idle") setMode("thinking");
  }, [speechEnd, mode]);

  useEffect(() => {
    if (speechStart) {
      // energy pulse trigger via class toggle
      const el = document.querySelector(".maha-reactor");
      if (!el) return;
      el.classList.add("energy-pulse");
      const t = window.setTimeout(() => el.classList.remove("energy-pulse"), 600);
      return () => window.clearTimeout(t);
    }
  }, [speechStart]);

  useEffect(() => {
    if (mode === "thinking" && !isSpeaking) {
      const t = window.setTimeout(() => setMode("idle"), 1400);
      return () => window.clearTimeout(t);
    }
  }, [mode, isSpeaking]);

  const [reply, setReply] = useState("How can I help?");
  const [attachments, setAttachments] = useState<string[]>([]);
  const commandRef = useRef<CommandBarHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { addMemory } = useMemory();

  const transcribe = useServerFn(transcribeMaha);

  const runPrompt = useCallback(
    async (prompt: string) => {
      setMode("thinking");
      setReply("Thinking…");
      try {
        const res = await fetch("/api/maha/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok || !res.body) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Request failed: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        setReply("");
        setMode("speaking");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setReply(acc);
        }
        acc += decoder.decode();
        setReply(acc || "…");
        window.setTimeout(() => setMode("idle"), 1600);
      } catch (e) {
        setReply(e instanceof Error ? e.message : "Something went wrong.");
        setMode("idle");
      }
    },
    [],
  );

  const handleSend = (message: string) => {
    const suffix = attachments.length
      ? `\n\n[Attached: ${attachments.join(", ")}]`
      : "";
    setAttachments([]);
    addMemory(message, "conversation");
    void runPrompt(message + suffix);
  };

  const handleAttach = () => fileInputRef.current?.click();

  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
      setReply(`Attached ${files.map((f) => f.name).join(", ")}`);
    }
    e.target.value = "";
  };

  const handleKeyboard = () => commandRef.current?.focus();

  const stopRecording = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return;
    await new Promise<void>((resolve) => {
      rec.addEventListener("stop", () => resolve(), { once: true });
      rec.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;

    const mimeType = rec.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    if (blob.size < 1024) {
      setReply("Recording was too short. Try again.");
      setMode("idle");
      return;
    }
    setMode("thinking");
    setReply("Transcribing…");
    try {
      const buf = await blob.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const audioBase64 = btoa(binary);
      const { text } = await transcribe({ data: { audioBase64, mimeType } });
      const clean = text.trim();
      if (!clean) {
        setReply("Didn't catch that. Try again.");
        setMode("idle");
        return;
      }
      commandRef.current?.setValue(clean);
      await runPrompt(clean);
    } catch (e) {
      setReply(e instanceof Error ? e.message : "Transcription failed.");
      setMode("idle");
    }
  }, [transcribe, runPrompt]);

  const handleVoice = async () => {
    if (mode === "listening") {
      await stopRecording();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.start();
      setMode("listening");
      setReply("Listening… tap the mic to stop.");
    } catch {
      setReply("Microphone access denied.");
      setMode("idle");
    }
  };

  return (
    <main className="maha-home">
      <BackgroundFX />
      <ParticleEngine isSpeaking={isSpeaking} volume={volume} state={reactorState} />

      <header className="maha-header">
        <h1>MAHA</h1>
        <span>AI OPERATING SYSTEM</span>
        <span
          className="maha-realtime-status"
          data-connected={realtimeConnected ? "true" : "false"}
          aria-label={realtimeConnected ? "Realtime connected" : "Realtime offline"}
        >
          <span className="dot" /> {realtimeConnected ? "LIVE" : "OFFLINE"}
        </span>
      </header>

      <section className="maha-hero hero-section">
        <div className="maha-waveform">
          <AudioWaveform active={mode === "listening"} />
        </div>

        <div className="reactor-wrapper maha-reactor">
          <CircularWaveform data={frequencyData} intensity={volume} state={reactorState} />
          <ReactorCore state={reactorState} />
          <div className="reactor-3d-container" aria-hidden="true">
            <ClientOnly fallback={null}>
              <Suspense fallback={null}>
                <ReactorScene state={reactorState} volume={volume} />
              </Suspense>
            </ClientOnly>
          </div>
        </div>

        <div className="hero-message assistant-message" aria-live="polite">
          <StreamingText text={realtimeResponse || reply || ""} speed={15} />
        </div>

        <StateTransition state={reactorState} />

        {attachments.length > 0 && (
          <p className="assistant-attachments" aria-live="polite">
            📎 {attachments.join(", ")}
          </p>
        )}
      </section>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFilesPicked}
      />

      <CommandBar
        ref={commandRef}
        onSend={handleSend}
        onVoice={handleVoice}
        onAttach={handleAttach}
        onKeyboard={handleKeyboard}
        isVoiceActive={mode === "listening"}
        isBusy={mode === "thinking"}
      />
      <FloatingMenu />
    </main>
  );
}
