import { useEffect, useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";

export const useWakeWord = (wakeWord = "hey maha") => {
  const { isListening, transcript, startListening, stopListening } =
    useSpeechRecognition();
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    if (transcript.toLowerCase().includes(wakeWord.toLowerCase())) {
      setAwake(true);
      stopListening();
    }
  }, [transcript, wakeWord, stopListening]);

  const wake = () => {
    setAwake(true);
    startListening();
  };

  const sleep = () => {
    setAwake(false);
    stopListening();
  };

  return { awake, isListening, transcript, wake, sleep };
};
