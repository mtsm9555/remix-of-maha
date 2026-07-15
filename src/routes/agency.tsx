import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Search, Loader2, Send, Users } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AGENTS, DIVISIONS, type Agent } from "@/lib/agency";
import { runAgent } from "@/lib/agency.functions";

export const Route = createFileRoute("/agency")({

  head: () => ({
    meta: [
      { title: "The Agency — 228 AI Specialists" },
      {
        name: "description",
        content:
          "A full AI agency: 228 specialist agents across 17 divisions — engineering, design, marketing, finance, and more. Chat with any of them.",
      },
      { property: "og:title", content: "The Agency — 228 AI Specialists" },
      {
        property: "og:description",
        content: "Chat with 228 specialist AI agents across 17 divisions.",
      },
    ],
  }),
  component: AgencyPage,
});

function AgencyPage() {
  const [query, setQuery] = useState("");
  const [activeDiv, setActiveDiv] = useState<string | null>(null);
  const [selected, setSelected] = useState<Agent | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AGENTS.filter((a) => {
      if (activeDiv && a.division !== activeDiv) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.vibe.toLowerCase().includes(q)
      );
    });
  }, [query, activeDiv]);

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />
      <PageShell
        eyebrow="The Company"
        title="The Agency"
        subtitle={`${AGENTS.length} specialist AI agents across ${Object.keys(DIVISIONS).length} divisions — powered by Lovable AI.`}
      >
        {/* Filter bar */}
        <div className="rounded-[24px] border border-white/5 bg-[#0d0e14] p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              placeholder="Search 228 agents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-black/30 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-violet-400/60 focus:outline-none"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip active={activeDiv === null} onClick={() => setActiveDiv(null)}>
              All · {AGENTS.length}
            </Chip>
            {Object.entries(DIVISIONS).map(([key, d]) => {
              const count = AGENTS.filter((a) => a.division === key).length;
              if (!count) return null;
              return (
                <Chip
                  key={key}
                  active={activeDiv === key}
                  color={d.color}
                  onClick={() => setActiveDiv(key)}
                >
                  {d.label} · {count}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Roster */}
        <section className="mt-8">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Users className="h-4 w-4" />
            {filtered.length} {filtered.length === 1 ? "agent" : "agents"}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <AgentCard
                key={a.slug}
                agent={a}
                onSelect={() => setSelected(a)}
                selected={selected?.slug === a.slug}
              />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-white/40">
                No agents match your search.
              </p>
            )}
          </div>
        </section>

        {selected && (
          <ChatPanel
            agent={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </PageShell>
    </>
  );
}

function AgentCard({
  agent,
  onSelect,
  selected,
}: {
  agent: Agent;
  onSelect: () => void;
  selected: boolean;
}) {
  const divColor = DIVISIONS[agent.division]?.color ?? "#8b5cf6";
  return (
    <button
      onClick={onSelect}
      className={`group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-violet-400/80 bg-violet-500/10"
          : "border-white/5 bg-[#0d0e14] hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
          style={{ background: `${divColor}22`, border: `1px solid ${divColor}55` }}
        >
          {agent.emoji || "🤖"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-semibold text-white">{agent.name}</div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: divColor }}>
            {DIVISIONS[agent.division]?.label ?? agent.division}
          </div>
        </div>
      </div>
      {agent.vibe && (
        <p className="text-xs italic text-white/50 line-clamp-2">{agent.vibe}</p>
      )}
      <p className="text-xs text-white/60 line-clamp-3">{agent.description}</p>
    </button>
  );
}

function ChatPanel({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState(false);
  const [thread, setThread] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const divColor = DIVISIONS[agent.division]?.color ?? "#8b5cf6";

  async function send() {
    if (!msg.trim() || pending) return;
    const userMsg = msg.trim();
    setThread((t) => [...t, { role: "user", text: userMsg }]);
    setMsg("");
    setPending(true);
    try {
      const res = await runAgent({ data: { slug: agent.slug, message: userMsg } });
      setThread((t) => [...t, { role: "agent", text: res.reply }]);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      toast.error(`${agent.name} failed: ${m}`);
      setThread((t) => [...t, { role: "agent", text: `⚠️ ${m}` }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0b12]/95 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
              style={{ background: `${divColor}22`, border: `1px solid ${divColor}66` }}
            >
              {agent.emoji || "🤖"}
            </span>
            <div>
              <div className="font-semibold text-white">{agent.name}</div>
              <div className="text-xs" style={{ color: divColor }}>
                {DIVISIONS[agent.division]?.label ?? agent.division}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {thread.length > 0 && (
          <div className="mb-3 max-h-64 overflow-y-auto space-y-2 rounded-xl border border-white/5 bg-black/30 p-3">
            {thread.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg p-2 text-sm ${
                  m.role === "user"
                    ? "bg-violet-500/15 text-white/90"
                    : "bg-white/5 text-white/80"
                }`}
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-widest text-white/40">
                  {m.role === "user" ? "You" : agent.name}
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder={`Ask ${agent.name} anything…`}
            className="min-h-[52px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={pending}
          />
          <Button onClick={send} disabled={pending || !msg.trim()} size="lg">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.8)]"
          : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
      }`}
      style={
        active
          ? { background: color ? `linear-gradient(90deg, ${color}, ${color}bb)` : undefined }
          : undefined
      }
    >
      {children}
    </button>
  );
}
