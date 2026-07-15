// src/stores/hudStore.ts

import { create } from "zustand";

interface HudState {
  activeTools: string[];
  activeAgents: string[];
  status: "idle" | "listening" | "thinking" | "speaking";

  startTool: (tool: string) => void;
  stopTool: (tool: string) => void;

  startAgent: (agent: string) => void;
  stopAgent: (agent: string) => void;

  setStatus: (
    status: "idle" | "listening" | "thinking" | "speaking"
  ) => void;
}

export const useHudStore = create<HudState>((set) => ({
  activeTools: [],
  activeAgents: [],
  status: "idle",

  startTool: (tool) =>
    set((s) => ({
      activeTools: [...new Set([...s.activeTools, tool])],
    })),

  stopTool: (tool) =>
    set((s) => ({
      activeTools: s.activeTools.filter((t) => t !== tool),
    })),

  startAgent: (agent) =>
    set((s) => ({
      activeAgents: [...new Set([...s.activeAgents, agent])],
    })),

  stopAgent: (agent) =>
    set((s) => ({
      activeAgents: s.activeAgents.filter((a) => a !== agent),
    })),

  setStatus: (status) => set({ status }),
}));