import { useState } from "react";
import { Network, Search, Plus } from "lucide-react";
import { knowledgeGraph, type Entity, type Relationship } from "@/knowledge";

export default function KnowledgeGraphPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entity[]>([]);
  const [edges, setEdges] = useState<Relationship[]>([]);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("concept");
  const [status, setStatus] = useState<string>("");

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    const found = await knowledgeGraph.search(q);
    setResults(found);
    setSelected(null);
    setEdges([]);
    setStatus(`${found.length} match${found.length === 1 ? "" : "es"}`);
  };

  const addEntity = async () => {
    const n = name.trim();
    if (!n) return;
    const e = await knowledgeGraph.createEntity(n, type);
    setName("");
    setStatus(`Added "${e.name}" (${e.type})`);
  };

  const inspect = async (e: Entity) => {
    setSelected(e);
    const connected = await knowledgeGraph.expand(e.id);
    setEdges(connected);
  };

  return (
    <div className="rounded-xl border border-[#152533] bg-[#0B1118] p-3 overflow-hidden">
      <div className="mb-3 flex items-center gap-2 text-cyan-300">
        <Network size={16} />
        <span className="text-xs tracking-[0.2em]">KNOWLEDGE GRAPH</span>
      </div>

      {/* Query */}
      <div className="flex gap-2 mb-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search entities…"
          className="flex-1 bg-[#05080C] border border-[#152533] rounded-md px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={runSearch}
          className="px-2 rounded-md bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 active:scale-95"
          aria-label="Search"
        >
          <Search size={14} />
        </button>
      </div>

      {/* Add */}
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New entity name"
          className="flex-1 bg-[#05080C] border border-[#152533] rounded-md px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="type"
          className="w-20 bg-[#05080C] border border-[#152533] rounded-md px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={addEntity}
          className="px-2 rounded-md bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 active:scale-95"
          aria-label="Add entity"
        >
          <Plus size={14} />
        </button>
      </div>

      {status && (
        <div className="text-[10px] text-cyan-300/60 mb-2 tracking-wider">{status}</div>
      )}

      {/* Results */}
      <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
        {results.length === 0 ? (
          <div className="text-xs text-slate-500 italic">No results yet.</div>
        ) : (
          results.map((e) => (
            <button
              key={e.id}
              onClick={() => inspect(e)}
              className={`w-full text-left px-2 py-1.5 rounded-md border text-xs transition ${
                selected?.id === e.id
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                  : "border-[#152533] bg-[#05080C] text-slate-300 hover:border-cyan-400/40"
              }`}
            >
              <span className="font-medium">{e.name}</span>
              <span className="ml-2 text-[10px] text-slate-500 uppercase tracking-wider">
                {e.type}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Connections */}
      {selected && (
        <div className="border-t border-[#152533] pt-2">
          <div className="text-[10px] text-cyan-300/80 tracking-[0.2em] mb-1">
            CONNECTIONS · {selected.name}
          </div>
          {edges.length === 0 ? (
            <div className="text-xs text-slate-500 italic">No relationships.</div>
          ) : (
            <ul className="space-y-1 max-h-28 overflow-y-auto">
              {edges.map((r) => (
                <li
                  key={r.id}
                  className="text-xs text-slate-300 flex items-center gap-1"
                >
                  <span className="text-cyan-400/70">→</span>
                  <span className="text-cyan-300">{r.relationType}</span>
                  <span className="text-slate-500">
                    ({r.sourceId === selected.id ? "out" : "in"})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}