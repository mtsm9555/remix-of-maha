import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";


const NAV = [
  { to: "/", label: "Deck" },
  { to: "/chat", label: "Chat" },
  { to: "/hud", label: "HUD" },
  { to: "/tools", label: "Tools" },
  { to: "/agency", label: "Agency" },
  { to: "/logs", label: "Logs" },
  { to: "/settings", label: "Settings" },
] as const;

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () =>
      setT(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const time = useClock();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-cyan-400 focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-[#030307]"
      >
        Skip to content
      </a>

      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl border-b border-white/[0.06] bg-[#030307]/70">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            aria-label="Maha 3.0 home"
            className="flex items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030307]"
          >
            <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              <div className="absolute inset-0 rotate-45 animate-pulse rounded-md bg-gradient-to-tr from-cyan-400 to-purple-500" />
              <div className="absolute h-4 w-4 rotate-45 rounded-sm bg-[#030307]" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-white">
              Maha <span className="text-white/60">3.0</span>
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center justify-center gap-7 text-xs font-medium uppercase tracking-wider text-slate-300 md:flex"
          >
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-sm px-1 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    active ? "text-cyan-400" : "hover:text-cyan-400"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div
              aria-hidden="true"
              className="hidden font-mono text-[11px] tracking-widest text-slate-400 tabular-nums lg:block"
            >
              {time || "--:--:--"}
            </div>

            <Link
              to="/chat"
              className="group relative hidden overflow-hidden rounded-full p-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030307] sm:inline-block"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
              <span className="relative inline-flex h-full w-full items-center justify-center rounded-full bg-[#030307] px-4 py-2 text-xs font-semibold text-white transition-all group-hover:bg-transparent">
                Deploy Agent
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        <div
          id="mobile-nav"
          hidden={!menuOpen}
          className="md:hidden border-t border-white/[0.06] bg-[#030307]/95 backdrop-blur-xl"
        >
          <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-4">
            <ul className="flex flex-col gap-1">
              {NAV.map((n) => {
                const active = pathname === n.to;
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        active
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                          : "border-white/[0.06] bg-white/[0.02] text-slate-200 hover:border-cyan-400/30 hover:text-cyan-300"
                      }`}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-2 sm:hidden">
                <Link
                  to="/chat"
                  className="flex min-h-11 items-center justify-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-[#030307] shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                >
                  Deploy Agent
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        className="relative z-10 min-h-dvh px-5 pt-24 pb-16 sm:px-6 md:px-12 md:pt-28"
      >
        <section className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-widest text-cyan-300">
                <span className="h-1 w-1 animate-ping rounded-full bg-cyan-400" />
                {eyebrow}
              </div>
            )}
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gradient-soft sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-slate-300 md:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {actions}
        </section>

        <div className="mx-auto mt-10 max-w-7xl">{children}</div>
      </main>
    </>
  );
}

