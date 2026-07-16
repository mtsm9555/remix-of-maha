import { CapabilityStore } from "./CapabilityStore";

export class DynamicCapabilityManager {
  static async revokeTool(agentId: string, toolName: string): Promise<boolean> {
    const current = await CapabilityStore.getAgentCapabilities(agentId);
    if (!current) return false;
    const updated = current.tools.filter((t) => t.name !== toolName);
    if (updated.length === current.tools.length) return false;
    current.tools = updated;
    current.lastUpdated = new Date();
    await CapabilityStore.upsertAgentCapabilities(current);
    return true;
  }

  static async upgradeModel(agentId: string, newModelName: string): Promise<boolean> {
    const current = await CapabilityStore.getAgentCapabilities(agentId);
    if (!current) return false;
    current.primaryModel.modelName = newModelName;
    current.lastUpdated = new Date();
    await CapabilityStore.upsertAgentCapabilities(current);
    return true;
  }

  static async canHandlePayload(agentId: string, tokenCount: number): Promise<boolean> {
    const current = await CapabilityStore.getAgentCapabilities(agentId);
    if (!current) return false;
    return tokenCount <= current.primaryModel.contextWindowTokens;
  }
}