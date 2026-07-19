import { useEffect, useState } from "react";
import { realtime } from "@/services/realtime";

export function useRealtime() {
  const [connected, setConnected] = useState(false);
  const [response, setResponse] = useState("");

  useEffect(() => {
    realtime.connect();
    const offC = realtime.on("connected", () => setConnected(true));
    const offD = realtime.on("disconnected", () => setConnected(false));
    const offM = realtime.on("message", (msg) => {
      const m = msg as { type?: string; text?: string; delta?: string };
      if (m?.type === "assistant_text" || m?.type === "response.text.delta") {
        setResponse((prev) => prev + (m.text ?? m.delta ?? ""));
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
    resetResponse: () => setResponse(""),
    send: (data: unknown) => realtime.send(data),
  };
}