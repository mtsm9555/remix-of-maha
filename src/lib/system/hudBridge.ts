// src/lib/system/hudBridge.ts

import { mahaBus } from "./eventBus";
import { useHudStore } from "@/stores/hudStore";

export function initializeHudBridge() {
  const store = useHudStore.getState();

  mahaBus.on("voice:start", () => {
    store.setStatus("listening");
  });

  mahaBus.on("voice:end", () => {
    store.setStatus("thinking");
  });

  mahaBus.on("thinking:end", () => {
    store.setStatus("speaking");
  });

  mahaBus.on("tool:start", (payload) => {
    if (payload?.name) store.startTool(payload.name);
  });

  mahaBus.on("tool:end", (payload) => {
    if (payload?.name) store.stopTool(payload.name);
  });

  mahaBus.on("agent:start", (payload) => {
    if (payload?.name) store.startAgent(payload.name);
  });

  mahaBus.on("agent:end", (payload) => {
    if (payload?.name) store.stopAgent(payload.name);
  });
}
