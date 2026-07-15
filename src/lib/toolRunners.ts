import { runTool } from "./tools.functions";

export type ToolKey =
  | "hermes"
  | "picoclaw"
  | "nemotron-ocr"
  | "nvidia-build"
  | "n8n"
  | "openclaw"
  | "genspark"
  | "orchestrator";


export type ToolRunner = {
  key: ToolKey;
  label: string;
  category: string;
  inputLabel: string;
  placeholder: string;
  sampleInput: string;
  run: (input: string) => Promise<string>;
};

const call = (tool: ToolKey) => async (input: string) => {
  const { output } = await runTool({ data: { tool, input } });
  return output;
};

export const TOOL_RUNNERS: ToolRunner[] = [
  {
    key: "hermes",
    label: "Hermes Agent",
    category: "ai",
    inputLabel: "Prompt",
    placeholder: "Ask Hermes anything…",
    sampleInput: "Say hello in one short sentence.",
    run: call("hermes"),
  },
  {
    key: "picoclaw",
    label: "Picoclaw",
    category: "automation",
    inputLabel: "Command",
    placeholder: "e.g. open https://example.com",
    sampleInput: "ping",
    run: call("picoclaw"),
  },
  {
    key: "nemotron-ocr",
    label: "Nemotron OCR",
    category: "vision",
    inputLabel: "Image URL",
    placeholder: "https://…/image.png",
    sampleInput: "https://picsum.photos/id/1025/400/300",
    run: call("nemotron-ocr"),
  },
  {
    key: "nvidia-build",
    label: "NVIDIA Build",
    category: "ai",
    inputLabel: "Skill / input JSON",
    placeholder: '{"skill":"summarize","input":"…"}',
    sampleInput: '{"skill":"summarize","input":"Lovable is a platform for building web apps."}',
    run: call("nvidia-build"),
  },
  {
    key: "n8n",
    label: "n8n Workflow",
    category: "automation",
    inputLabel: "Workflow ID + JSON payload",
    placeholder: '{"workflowId":"abc123","payload":{"foo":"bar"}}',
    sampleInput: '{"workflowId":"test","payload":{"ping":true}}',
    run: call("n8n"),
  },
  {
    key: "openclaw",
    label: "OpenClaw",
    category: "ai",
    inputLabel: "Message for your personal assistant",
    placeholder: "Ask OpenClaw anything…",
    sampleInput: "Draft a 1-line status update for the team standup.",
    run: call("openclaw"),
  },
  {
    key: "genspark",
    label: "Genspark Super Agent",
    category: "ai",
    inputLabel: "Research task or question",
    placeholder: "e.g. Compare Bun vs Node for a serverless API in 2026",
    sampleInput: "Give me a 2026 buyer's guide for a $600 4K OLED monitor.",
    run: call("genspark"),
  },
  {
    key: "orchestrator",
    label: "Orchestrator (all tools)",
    category: "automation",
    inputLabel: "Natural-language task — auto-routed across tools",
    placeholder: "e.g. OCR this image: https://…/pic.png",
    sampleInput: "Say hello and route the reply through OpenClaw.",
    run: call("orchestrator"),
  },

];

export function findRunner(name: string | null | undefined): ToolRunner | undefined {
  if (!name) return undefined;
  const key = name.toLowerCase();
  return TOOL_RUNNERS.find(
    (r) => r.key === key || r.label.toLowerCase() === key || key.includes(r.key),
  );
}
