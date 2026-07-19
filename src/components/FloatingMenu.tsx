import { useState } from "react";
import {
  Brain,
  Eye,
  FolderOpen,
  CalendarDays,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

const menuItems = [
  { label: "Memory", icon: Brain, color: "#00d9ff" },
  { label: "Vision", icon: Eye, color: "#00ffb3" },
  { label: "Files", icon: FolderOpen, color: "#ffc857" },
  { label: "Planner", icon: CalendarDays, color: "#ff7b72" },
  { label: "Settings", icon: Settings, color: "#b388ff" },
];

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);

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
              <button key={item.label} className="menu-item" role="menuitem" type="button">
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
    </>
  );
}