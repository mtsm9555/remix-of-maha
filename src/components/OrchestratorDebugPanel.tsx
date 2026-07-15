import { useState } from "react";
import { routeTask } from "@/lib/tools.functions";
import { Bug, Loader2, Play, Route as RouteIcon, Trash2 } from "lucide-react";

type RouteResult = {
  task: string;
  tool: string;
  input: string;
  reason: string;
  routerMs: number;
  output?: string;
  executionMs?: number;
  error?: string;
  at: number;
};

const TOOL_COLORS: Record<string, string> = {
  genspark: "from-fuchsia-500 to-violet-500",
  hermes: "from-cyan-500 to-blue-500",
  picoclaw: "from-emerald-500 to-teal-500",
  "nemotron-ocr": "from-lime-500 to-green-500",
  "nvidia-build": "from-green-500 to-emerald-500",
  n8n: "from-orange-500 to-rose-500",
  openclaw: "from-indigo-500 to-violet-500",
};

export function OrchestratorDebugPanel() {
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [execute, setExecute] = useState(false);
  const [history, setHistory] = useState<RouteResult[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!task.trim() || busy) return;
    setBusy(true);
    try {
      const r = await routeTask({ data: { task, execute } });
      setHistory((h) => [{ ...r, task, at: Date.now() }, ...h].slice(0, 20));
    } catch (err) {
      setHistory((h) =>
        [
          {
            task,
            tool: "—",
            input: "",
            reason: "",
            routerMs: 0,
            error: err instanceof Error ? err.message : String(err),
            at: Date.now(),
          },
          ...h,
        ].slice(0, 20),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-[24px] border border-white/5 bg-[#0d0e14] p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-rose-500/20 text-amber-300">
          <Bug className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
            Orchestrator
          </div>
          <h2 className="text-xl font-semibold text-white">Router debug panel</h2>
          <p className="text-sm text-white/50">
            Inspect which tool the orchestrator picks for any request — and why.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
          placeholder="Type a request… e.g. 'Compare Postgres vs MongoDB for analytics'"
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400/60 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={execute}
              onChange={(e) => setExecute(e.target.checked)}
              className="h-3.5 w-3.5 accent-violet-500"
            />
            Also execute the chosen tool
          </label>
          <button
            type="submit"
            disabled={busy || !task.trim()}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.8)] transition disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : execute ? (
              <Play className="h-4 w-4" />
            ) : (
              <RouteIcon className="h-4 w-4" />
            )}
            {execute ? "Route + run" : "Route only"}
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistory([])}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </form>

      {history.length > 0 && (
        <ul className="mt-6 space-y-3">
          {history.map((r) => {
            const color = TOOL_COLORS[r.tool] ?? "from-white/20 to-white/10";
            return (
              <li
                key={r.at}
                className="rounded-2xl border border-white/5 bg-black/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white/80">{r.task}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/30">
                      {new Date(r.at).toLocaleTimeString()} · router {r.routerMs}ms
                      {r.executionMs !== undefined ? ` · exec ${r.executionMs}ms` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full bg-gradient-to-r ${color} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white`}
                  >
                    {r.tool}
                  </span>
                </div>

                {r.reason && (
                  <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      Why
                    </div>
                    <p className="mt-1 text-sm text-white/70">{r.reason}</p>
                  </div>
                )}

                {r.input && r.input !== r.task && (
                  <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      Rewritten tool input
                    </div>
                    <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-cyan-300">
                      {r.input}
                    </pre>
                  </div>
                )}

                {r.error && (
                  <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                    {r.error}
                  </div>
                )}

                {r.output && (
                  <details className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-white/40">
                      Tool output
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-white/70">
                      {r.output}
                    </pre>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
