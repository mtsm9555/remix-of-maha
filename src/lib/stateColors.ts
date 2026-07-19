import type { AIState } from "@/services/stateMachine";

export const STATE_COLORS: Record<AIState, string> = {
  booting: "#00d9ff",
  idle: "#00d9ff",
  listening: "#00ff9d",
  thinking: "#4f8fff",
  reasoning: "#8b5cf6",
  speaking: "#ffc857",
  vision: "#ff4fd8",
  memory: "#14b8a6",
  executing: "#ff6b6b",
  error: "#ff2d55",
};

export const RING_SPEEDS: Record<AIState, number> = {
  booting: 0.1,
  idle: 0.15,
  listening: 0.4,
  thinking: 0.8,
  reasoning: 1.4,
  speaking: 0.6,
  vision: 1.2,
  memory: 0.5,
  executing: 2.0,
  error: 0.2,
};

export const PARTICLE_SPAWN_RATE: Record<AIState, number> = {
  booting: 0,
  idle: 0,
  listening: 2,
  thinking: 4,
  reasoning: 8,
  speaking: 12,
  vision: 6,
  memory: 3,
  executing: 20,
  error: 1,
};