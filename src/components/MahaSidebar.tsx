import { useState } from "react";
import { Zap, Brain, Eye, ListChecks, Terminal, Settings } from "lucide-react";

type Item = { id: string; label: string; icon: typeof Zap };

const ITEMS: Item[] = [
  { id: "reactor", label: "Reactor", icon: Zap },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "vision", label: "Vision", icon: Eye },
  { id: "planner", label: "Planner", icon: ListChecks },
  { id: "logs", label: "Logs", icon: Terminal },
];

export default function MahaSidebar() {
  const [active, setActive] = useState("reactor");
  return (
    <aside className="maha-sidebar" aria-label="Modules">
      <a href="/" className="maha-sidebar-brand" aria-label="MAHA OS home">
        <span />
      </a>
      <nav className="maha-sidebar-nav">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              type="button"
              className="maha-sidebar-btn"
              data-active={isActive ? "true" : "false"}
              aria-current={isActive ? "page" : undefined}
              aria-label={it.label}
              onClick={() => setActive(it.id)}
            >
              <Icon aria-hidden="true" />
              <span className="maha-sidebar-tip">{it.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="maha-sidebar-foot">
        <button type="button" className="maha-sidebar-btn" aria-label="Settings">
          <Settings aria-hidden="true" />
          <span className="maha-sidebar-tip">Settings</span>
        </button>
      </div>
    </aside>
  );
}