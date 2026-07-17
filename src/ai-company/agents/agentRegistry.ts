import type { Agent, AgentRole, AgentStatus } from "./agentTypes";

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  createAgent(id: string, name: string, role: AgentRole, skills: string[] = []): Agent {
    const now = new Date().toISOString();
    const agent: Agent = {
      id,
      name,
      role,
      status: "idle",
      skills,
      createdAt: now,
      updatedAt: now,
    };
    this.agents.set(id, agent);
    return agent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  updateAgentStatus(id: string, status: AgentStatus): Agent {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    agent.status = status;
    agent.updatedAt = new Date().toISOString();
    this.agents.set(id, agent);
    return agent;
  }

  assignSkill(id: string, skill: string): Agent {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    if (!agent.skills.includes(skill)) {
      agent.skills.push(skill);
      agent.updatedAt = new Date().toISOString();
      this.agents.set(id, agent);
    }
    return agent;
  }

  archiveAgent(id: string): Agent {
    return this.updateAgentStatus(id, "archived");
  }
}