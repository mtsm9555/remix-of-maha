import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "AI Company Dashboard" },
      { name: "description", content: "Manage agents, goals, tasks, reasoning, and tools." },
    ],
  }),
  component: DashboardPage,
});

const API = "/api/ai-company";

async function jpost(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function jget(path: string) {
  const res = await fetch(`${API}${path}`);
  return res.json();
}

function DashboardPage() {
  const [output, setOutput] = useState<unknown>(null);
  const [agents, setAgents] = useState<unknown>(null);
  const [goals, setGoals] = useState<unknown>(null);
  const [memory, setMemory] = useState<unknown>(null);
  const [audit, setAudit] = useState<unknown>(null);

  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentRole, setAgentRole] = useState("worker");
  const [agentSkills, setAgentSkills] = useState("");

  const [goalId, setGoalId] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");

  const [reasonAgentId, setReasonAgentId] = useState("");
  const [reasonGoal, setReasonGoal] = useState("");

  const [toolAgentId, setToolAgentId] = useState("");
  const [toolName, setToolName] = useState("calculator");
  const [toolInput, setToolInput] = useState('{"expression":"2+2"}');

  const loadAgents = async () => setAgents(await jget("/agents"));
  const loadGoals = async () => setGoals(await jget("/goals"));
  const loadMemory = async () => setMemory(await jget("/memory"));
  const loadAudit = async () => setAudit(await jget("/audit"));

  useEffect(() => {
    loadAgents();
    loadGoals();
    loadMemory();
    loadAudit();
  }, []);

  const createAgent = async () => {
    const data = await jpost("/agents", {
      id: agentId,
      name: agentName,
      role: agentRole,
      skills: agentSkills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setOutput(data);
    loadAgents();
  };

  const createGoal = async () => {
    const data = await jpost("/goals", { id: goalId, title: goalTitle, description: goalDesc });
    setOutput(data);
    loadGoals();
  };

  const runReasoning = async () => {
    const data = await jpost("/reason", { agentId: reasonAgentId, goal: reasonGoal, context: {} });
    setOutput(data);
  };

  const runTool = async () => {
    let input: unknown = {};
    try {
      input = JSON.parse(toolInput || "{}");
    } catch {
      alert("Invalid JSON input");
      return;
    }
    const data = await jpost("/tools/run", {
      agentId: toolAgentId,
      call: {
        id: `call-${Date.now()}`,
        tool: toolName,
        input,
        requestedBy: toolAgentId,
        createdAt: new Date().toISOString(),
      },
    });
    setOutput(data);
  };

  const inputCls =
    "w-full box-border p-2.5 mt-2 mb-2.5 rounded-lg border border-slate-600 bg-slate-950 text-white";
  const btnCls =
    "bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-lg mt-2.5 cursor-pointer";
  const cardCls = "bg-slate-900 border border-slate-700 rounded-xl p-4";
  const listCls = "mt-2.5 whitespace-pre-wrap text-sm text-slate-300";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-5" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="max-w-[1100px] mx-auto">
        <h1 className="text-2xl font-bold">AI Company Dashboard</h1>
        <p>Manage agents, goals, tasks, reasoning, and tools.</p>

        <div className="grid gap-4 mt-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <div className={cardCls}>
            <h3 className="font-semibold">Create Agent</h3>
            <input className={inputCls} placeholder="Agent ID" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
            <input className={inputCls} placeholder="Agent Name" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            <input className={inputCls} placeholder="Role" value={agentRole} onChange={(e) => setAgentRole(e.target.value)} />
            <input className={inputCls} placeholder="Skills comma separated" value={agentSkills} onChange={(e) => setAgentSkills(e.target.value)} />
            <button className={btnCls} onClick={createAgent}>Create</button>
          </div>

          <div className={cardCls}>
            <h3 className="font-semibold">Create Goal</h3>
            <input className={inputCls} placeholder="Goal ID" value={goalId} onChange={(e) => setGoalId(e.target.value)} />
            <input className={inputCls} placeholder="Goal Title" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
            <textarea className={inputCls} placeholder="Goal Description" value={goalDesc} onChange={(e) => setGoalDesc(e.target.value)} />
            <button className={btnCls} onClick={createGoal}>Create</button>
          </div>

          <div className={cardCls}>
            <h3 className="font-semibold">Run Reasoning</h3>
            <input className={inputCls} placeholder="Agent ID" value={reasonAgentId} onChange={(e) => setReasonAgentId(e.target.value)} />
            <input className={inputCls} placeholder="Goal" value={reasonGoal} onChange={(e) => setReasonGoal(e.target.value)} />
            <button className={btnCls} onClick={runReasoning}>Run</button>
          </div>

          <div className={cardCls}>
            <h3 className="font-semibold">Run Tool</h3>
            <input className={inputCls} placeholder="Agent ID" value={toolAgentId} onChange={(e) => setToolAgentId(e.target.value)} />
            <input className={inputCls} placeholder="Tool Name" value={toolName} onChange={(e) => setToolName(e.target.value)} />
            <input className={inputCls} placeholder='Input JSON like {"expression":"2+2"}' value={toolInput} onChange={(e) => setToolInput(e.target.value)} />
            <button className={btnCls} onClick={runTool}>Run</button>
          </div>
        </div>

        <div className="grid gap-4 mt-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <div className={cardCls}>
            <h3 className="font-semibold">Agents</h3>
            <button className={btnCls} onClick={loadAgents}>Refresh</button>
            <div className={listCls}>{JSON.stringify(agents, null, 2)}</div>
          </div>
          <div className={cardCls}>
            <h3 className="font-semibold">Goals</h3>
            <button className={btnCls} onClick={loadGoals}>Refresh</button>
            <div className={listCls}>{JSON.stringify(goals, null, 2)}</div>
          </div>
          <div className={cardCls}>
            <h3 className="font-semibold">Memory</h3>
            <button className={btnCls} onClick={loadMemory}>Refresh</button>
            <div className={listCls}>{JSON.stringify(memory, null, 2)}</div>
          </div>
          <div className={cardCls}>
            <h3 className="font-semibold">Audit Log</h3>
            <button className={btnCls} onClick={loadAudit}>Refresh</button>
            <div className={listCls}>{JSON.stringify(audit, null, 2)}</div>
          </div>
        </div>

        <div className={`${cardCls} mt-4`}>
          <h3 className="font-semibold">Output</h3>
          <div className={listCls}>{output ? JSON.stringify(output, null, 2) : ""}</div>
        </div>
      </div>
    </div>
  );
}