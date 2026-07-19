import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import "./os.css";
import BackgroundFX from "@/components/BackgroundFX";
import AudioWaveform from "@/components/AudioWaveform";
import ReactorCore from "@/components/ReactorCore";
import CommandBar from "@/components/CommandBar";
import FloatingMenu from "@/components/FloatingMenu";

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
  const [mode] = useState<Mode>("idle");

  return (
    <main className="maha-home">
      <BackgroundFX />

      <header className="maha-header">
        <h1>MAHA</h1>
        <span>AI OPERATING SYSTEM</span>
      </header>

      <section className="maha-hero">
        <div className="maha-waveform">
          <AudioWaveform active={mode !== "idle"} />
        </div>

        <div className="maha-reactor">
          <ReactorCore state={mode} />
        </div>

        <p className="assistant-message" aria-live="polite">
          How can I help?
        </p>
      </section>

      <CommandBar />
      <FloatingMenu />
    </main>
  );
}
