// src/index.ts

import { AgentRegistry } from "./agents/agentRegistry";
import { TaskStateManager } from "./lifecycle/taskStateManager";
import { PermissionManager } from "./security/permissionManager";
import { ReviewQueue } from "./review/reviewQueue";
import { SecureManager } from "./manager/secureManager";

const agentRegistry = new AgentRegistry();
const taskManager = new TaskStateManager();
const permissionManager = new PermissionManager();
const reviewQueue = new ReviewQueue();
const secureManager = new SecureManager(
  agentRegistry,
  taskManager,
  permissionManager,
  reviewQueue
);

agentRegistry.createAgent("agent-1", "Jarvis", "manager", ["coordination"]);
taskManager.createTask("task-1", "Secure task assignment");

console.log(
  secureManager.requestTaskAssignment(
    "user-1",
    "manager",
    "agent-1",
    "task-1"
  )
);

console.log("Reviews:", reviewQueue.getAllReviews());
