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
export * from "./manager/secureManager";
export * from "./security/permissionTypes";
export * from "./security/permissionManager";
export * from "./review/reviewTypes";
export * from "./review/reviewQueue";
export * from "./memory/memoryTypes";
export * from "./memory/memoryStore";
export * from "./memory/memoryManager";
export * from "./permissions/permissions";
export * from "./review/review";
export * from "./recovery/recoveryTypes";
export * from "./recovery/recoveryQueue";
export * from "./recovery/recoveryManager";
export * from "./audit/auditTypes";
export * from "./audit/auditLog";
export * from "./testing/systemTest";