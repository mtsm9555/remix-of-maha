import { useEffect, useState } from "react";
import { audioBus } from "@/services/audioBus";

export type AIState = "idle" | "listening" | "thinking" | "speaking";

export interface MicrophoneData {
  volume: number;
  state: AIState;
  frequencyData: Uint8Array | null;
}

export function useMicrophone(): MicrophoneData {
  const [volume, setVolume] = useState(0);
  const [state, setState] = useState<AIState>("idle");
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    let mounted = true;
    let off: (() => void) | undefined;
    let lastEmit = 0;

    audioBus
      .subscribe((snap) => {
        if (!mounted) return;
        // Throttle React updates to ~30fps to avoid flooding the render loop.
        const now = performance.now();
        if (now - lastEmit < 33) return;
        lastEmit = now;
        setVolume(snap.volume);
        setFrequencyData(new Uint8Array(snap.frequency));
        setState(snap.volume > 25 ? "listening" : "idle");
      })
      .then((cleanup) => {
        if (!mounted) cleanup();
        else off = cleanup;
      });

    return () => {
      mounted = false;
      off?.();
    };
  }, []);

  return { volume, state, frequencyData };
}
