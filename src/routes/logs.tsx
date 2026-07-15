import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { listLogs } from "@/lib/data.functions";
import type { Log } from "@/types";

export const Route = createFileRoute("/logs")({

  head: () => ({
    meta: [
      { title: "Logs — Maha" },
      { name: "description", content: "Recent activity across Maha's tasks and tools." },
      { property: "og:title", content: "Logs — Maha" },
      { property: "og:description", content: "Recent activity across Maha's tasks and tools." },
    ],
  }),
  component: LogsPage,
});

type LogRow = Log & {
  tasks: { title: string } | null;
  tools: { name: string } | null;
};

const STATUS_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  success: {
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  running: {
    dot: "bg-cyan-400 animate-pulse",
    text: "text-cyan-300",
    bg: "bg-cyan-400/10 border-cyan-400/20",
  },
  error: {
    dot: "bg-rose-400",
    text: "text-rose-300",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
};

function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listLogs();
        setLogs((data ?? []) as LogRow[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load logs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />
      <PageShell
        eyebrow="Telemetry"
        title="Activity Logs"
        subtitle={`${logs.length} recent ${logs.length === 1 ? "entry" : "entries"} from the agent runtime.`}
      >
        <div className="overflow-hidden rounded-[24px] border border-white/5 bg-[#0d0e14]">
          {loading ? (
            <p className="py-16 text-center text-white/40">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="py-16 text-center text-white/40">No logs yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {logs.map((log) => {
                const style =
                  STATUS_STYLES[log.status ?? ""] ?? {
                    dot: "bg-white/40",
                    text: "text-white/60",
                    bg: "bg-white/5 border-white/10",
                  };
                return (
                  <li
                    key={log.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {log.status && (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest ${style.bg} ${style.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {log.status}
                          </span>
                        )}
                        {log.tools?.name && (
                          <span className="text-sm font-medium text-white">
                            {log.tools.name}
                          </span>
                        )}
                        {log.tasks?.title && (
                          <span className="truncate text-sm text-white/50">
                            → {log.tasks.title}
                          </span>
                        )}
                      </div>
                      {log.message && (
                        <p className="whitespace-pre-wrap break-words font-mono text-xs text-white/60">
                          {log.message}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 font-mono text-[11px] text-white/40 tabular-nums">
                      {new Date(log.created_at).toLocaleString()}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PageShell>
    </>
  );
}
