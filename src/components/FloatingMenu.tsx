import { Menu } from "lucide-react";
import { useState } from "react";

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`floating-menu ${open ? "is-open" : ""}`}>
      {open && (
        <div className="floating-menu-panel" role="menu">
          <button role="menuitem">Dashboard</button>
          <button role="menuitem">Agents</button>
          <button role="menuitem">Memory</button>
          <button role="menuitem">Settings</button>
        </div>
      )}
      <button
        className="floating-menu-btn"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={20} />
      </button>
    </div>
  );
}