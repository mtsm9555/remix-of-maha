import { useEffect, useState } from "react";
import { realtime } from "@/services/realtime";

export function useRealtime() {
  const [connected, setConnected] = useState(false);
  const [response, setResponse] = useState("");
  const [waitingResponse, setWaitingResponse] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState(false);
  const [receivingAudio, setReceivingAudio] = useState(false);

  useEffect(() => {
    realtime.connect();
    const offC = realtime.on("connected", () => setConnected(true));
    const offD = realtime.on("disconnected", () => setConnected(false));
    const offM = realtime.on("message", (msg) => {
      const m = msg as { type?: string; text?: string; delta?: string };
      switch (m?.type) {
        case "assistant_text":
        case "response.text.delta":
          setWaitingResponse(false);
          setStreamingResponse(true);
          setResponse((prev) => prev + (m.text ?? m.delta ?? ""));
          break;
        case "response.audio.delta":
          setReceivingAudio(true);
          break;
        case "response.audio.done":
          setReceivingAudio(false);
          break;
        case "response.done":
        case "response.completed":
          setStreamingResponse(false);
          setWaitingResponse(false);
          setReceivingAudio(false);
          break;
      }
    });
    return () => {
      offC();
      offD();
      offM();
    };
  }, []);

  return {
    connected,
    response,
    waitingResponse,
    streamingResponse,
    receivingAudio,
    resetResponse: () => setResponse(""),
    send: (data: unknown) => {
      const d = data as { type?: string };
      if (d?.type === "user_message" || d?.type === "response.create") {
        setResponse("");
        setWaitingResponse(true);
        setStreamingResponse(false);
      }
      realtime.send(data);
    },
  };
}