// hooks/useSpeechSynthesis.ts
import { useRef, useState } from 'react';
import { synthesizeVoice } from '@/lib/tts.functions';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speak = async (text: string) => {
    if (!text?.trim()) return;
    stop();
    setIsSpeaking(true);
    try {
      const { audioBase64, mimeType } = await synthesizeVoice({ data: { text } });
      const url = `data:${mimeType};base64,${audioBase64}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch (err) {
      console.error('Voice synthesis failed:', err);
      setIsSpeaking(false);
    }
  };

  return { isSpeaking, speak, stop };
};
