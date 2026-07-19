import { Trash2, Brain, X } from "lucide-react";
import { useMemory } from "@/hooks/useMemory";

interface Props {
  onClose?: () => void;
}

export default function MemoryPanel({ onClose }: Props) {
  const { memories, deleteMemory, clearMemory } = useMemory();

  return (
    <aside className="memory-panel" role="dialog" aria-label="Memory">
      <div className="memory-header">
        <h2>
          <Brain size={18} /> Memory
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={clearMemory} className="memory-clear">
            Clear
          </button>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close memory panel" className="memory-clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="memory-list">
        {memories.length === 0 && (
          <p style={{ opacity: 0.5, fontSize: 13, padding: "10px 4px" }}>
            No memories yet.
          </p>
        )}
        {memories.map((memory) => (
          <div key={memory.id} className="memory-item">
            <div style={{ minWidth: 0, flex: 1 }}>
              <p>{memory.content}</p>
              <small>{new Date(memory.timestamp).toLocaleString()}</small>
            </div>
            <button
              type="button"
              onClick={() => deleteMemory(memory.id)}
              aria-label="Delete memory"
              className="memory-clear"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}