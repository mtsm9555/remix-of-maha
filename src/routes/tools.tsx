import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ExternalLink, Search } from "lucide-react";
import { TOOL_RUNNERS } from "@/lib/toolRunners";
import { ToolRunnerCard } from "@/components/ToolRunnerCard";
import { OrchestratorDebugPanel } from "@/components/OrchestratorDebugPanel";
import { PageShell } from "@/components/PageShell";
import { listTools } from "@/lib/data.functions";
import type { Tool } from "@/types";

export const Route = createFileRoute("/tools")({

  head: () => ({
    meta: [
      { title: "Tools — Maha" },
      { name: "description", content: "Browse and run Maha's connected tools." },
      { property: "og:title", content: "Tools — Maha" },
      { property: "og:description", content: "Browse and run Maha's connected tools." },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listTools();
        setTools(data as Tool[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load tools");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(tools.map((t) => t.category).filter(Boolean))) as string[],
    [tools],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (activeCategory && t.category !== activeCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.command_example ?? "").toLowerCase().includes(q)
      );
    });
  }, [tools, query, activeCategory]);

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />
      <PageShell
        eyebrow="Capabilities"
        title="Tools"
        subtitle={`${tools.length} ${tools.length === 1 ? "tool" : "tools"} connected and ready to run.`}
      >
        {/* Search + filters */}
        <div className="rounded-[24px] border border-white/5 bg-[#0d0e14] p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              placeholder="Search tools…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-black/30 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-violet-400/60 focus:outline-none"
            />
          </div>
          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip
                active={activeCategory === null}
                onClick={() => setActiveCategory(null)}
              >
                All
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Runners */}
        <section className="mt-8">
          <SectionHead eyebrow="Runners" title="Run a tool" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {TOOL_RUNNERS.map((r) => (
              <ToolRunnerCard key={r.key} runner={r} />
            ))}
          </div>
        </section>

        <OrchestratorDebugPanel />


        {/* Catalog */}
        <section className="mt-10">
          <SectionHead eyebrow="Directory" title="Catalog" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {loading ? (
              <p className="col-span-full py-8 text-center text-white/40">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="col-span-full py-8 text-center text-white/40">
                {tools.length === 0 ? "No tools yet." : "No tools match your search."}
              </p>
            ) : (
              filtered.map((tool) => (
                <article
                  key={tool.id}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/5 bg-[#0d0e14] p-5 transition hover:border-violet-400/40"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white">{tool.name}</h3>
                    {tool.category && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-white/60">
                        {tool.category}
                      </span>
                    )}
                  </div>
                  {tool.description && (
                    <p className="relative text-sm text-white/60">{tool.description}</p>
                  )}
                  {tool.command_example && (
                    <pre className="relative overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-xs text-cyan-300">
                      {tool.command_example}
                    </pre>
                  )}
                  {tool.url && (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative mt-auto inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </PageShell>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.8)]"
          : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
    </div>
  );
}
