import { useEffect, useRef, useState } from "react";
import { audioBus } from "@/services/audioBus";

export interface VoiceActivity {
  isSpeaking: boolean;
  volume: number;
  speechStart: boolean;
  speechEnd: boolean;
}

const THRESHOLD = 18;
const SILENCE_MS = 1200;

export function useVoiceActivity(): VoiceActivity {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [speechStart, setSpeechStart] = useState(false);
  const [speechEnd, setSpeechEnd] = useState(false);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let off: (() => void) | undefined;
    let lastEmit = 0;

    audioBus
      .subscribe((snap) => {
        if (!mounted) return;
        const avg = snap.volume;
        const now = performance.now();
        if (now - lastEmit >= 50) {
          setVolume(avg);
          lastEmit = now;
        }
        if (avg > THRESHOLD) {
          silenceTimerRef.current = now;
          if (!speakingRef.current) {
            speakingRef.current = true;
            setIsSpeaking(true);
            setSpeechStart(true);
            setSpeechEnd(false);
            setTimeout(() => setSpeechStart(false), 250);
          }
        } else if (speakingRef.current && now - silenceTimerRef.current > SILENCE_MS) {
          speakingRef.current = false;
          setIsSpeaking(false);
          setSpeechEnd(true);
          setTimeout(() => setSpeechEnd(false), 250);
        }
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

  return { isSpeaking, volume, speechStart, speechEnd };
}
