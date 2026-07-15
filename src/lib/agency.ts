import agencyData from "@/data/agency.json";

export type Division = { label: string; icon: string; color: string };
export type Agent = {
  slug: string;
  division: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  vibe: string;
  systemPrompt: string;
};

const data = agencyData as {
  divisions: Record<string, Division>;
  agents: Agent[];
};

export const DIVISIONS: Record<string, Division> = data.divisions;
export const AGENTS: Agent[] = data.agents;

export function agentsByDivision(div: string | null): Agent[] {
  if (!div) return AGENTS;
  return AGENTS.filter((a) => a.division === div);
}
