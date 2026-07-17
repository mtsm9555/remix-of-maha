export type AppConfig = {
  appName: string;
  version: string;
};

export type AgentStatus = "idle" | "working" | "paused" | "failed" | "archived";