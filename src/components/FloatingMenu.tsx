import { useState } from "react";
import MemoryPanel from "@/components/MemoryPanel";
import VisionPanel from "@/components/VisionPanel";
import PlannerPanel from "@/components/PlannerPanel";
import {
  Brain,
  Eye,
  FolderOpen,
  CalendarDays,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { theme } from "@/lib/maha/theme";

const menuItems = [
  { label: "Memory", icon: Brain, color: theme.cyan, action: "memory" as const },
  { label: "Vision", icon: Eye, color: theme.green, action: "vision" as const },
  { label: "Files", icon: FolderOpen, color: theme.gold },
  { label: "Planner", icon: CalendarDays, color: theme.blue, action: "planner" as const },
  { label: "Settings", icon: Settings, color: theme.glass },
];

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);

  return (
    <>
      <div
        className={`menu-overlay ${open ? "active" : ""}`}
        onClick={() => setOpen(false)}
      />

      <div className={`floating-menu ${open ? "open" : ""}`} role="menu" aria-hidden={!open}>
        <div className="menu-header">
          <div>
            <h3>MAHA</h3>
            <span>AI Modules</span>
          </div>
        </div>

        <div className="menu-items">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="menu-item"
                role="menuitem"
                type="button"
                onClick={() => {
                  if ("action" in item && item.action === "memory") {
                    setMemoryOpen((v) => !v);
                    setOpen(false);
                  }
                  if ("action" in item && item.action === "vision") {
                    setVisionOpen((v) => !v);
                    setOpen(false);
                  }
                  if ("action" in item && item.action === "planner") {
                    setPlannerOpen((v) => !v);
                    setOpen(false);
                  }
                }}
              >
                <div className="menu-icon" style={{ background: item.color }}>
                  <Icon size={18} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        className={`menu-fab ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        type="button"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {memoryOpen && (
        <div className="memory-panel-wrap">
          <MemoryPanel onClose={() => setMemoryOpen(false)} />
        </div>
      )}

      {visionOpen && (
        <div className="vision-panel-wrap">
          <VisionPanel onClose={() => setVisionOpen(false)} />
        </div>
      )}

      {plannerOpen && (
        <div className="planner-panel-wrap">
          <PlannerPanel onClose={() => setPlannerOpen(false)} />
        </div>
      )}
    </>
  );
}