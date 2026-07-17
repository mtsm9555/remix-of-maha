import { defaultConfig } from "./config";
import type { AppConfig } from "./types";

const config: AppConfig = defaultConfig;

console.log(`Starting ${config.appName} v${config.version}`);

export { config };
export * from "./types";
export * from "./lifecycle/lifecycleManager";
export * from "./lifecycle/taskStateManager";
export * from "./lifecycle/lifecycleRules";
export * from "./agents/agentTypes";
export * from "./agents/agentRegistry";
export * from "./manager/managerLayer";
export * from "./memory/memory";
export * from "./permissions/permissions";
export * from "./review/review";
export * from "./recovery/recovery";
export * from "./audit/audit";