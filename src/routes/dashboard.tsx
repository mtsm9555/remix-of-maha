import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Maha OS — Dashboard" },
      { name: "description", content: "Maha OS mobile dashboard." },
    ],
  }),
  component: MobileDashboard,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  errorComponent: ({ error }) => (
    <div className="p-8 text-destructive">{error.message}</div>
  ),
});

function MobileDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#05080C] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 h-16 border-b border-cyan-900/30 bg-[#05080C]/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 md:px-8">
          <h1 className="text-cyan-300 text-xl md:text-2xl font-bold tracking-[0.35em] md:tracking-[0.4em]">
            MAHA OS
          </h1>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-cyan-200/80">
            <button onClick={() => navigate({ to: "/" })} className="hover:text-cyan-300">Home</button>
            <button onClick={() => navigate({ to: "/chat" })} className="hover:text-cyan-300">Chat</button>
            <button onClick={() => navigate({ to: "/voice" })} className="hover:text-cyan-300">Voice</button>
            <button onClick={() => navigate({ to: "/settings" })} className="hover:text-cyan-300">Settings</button>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-6xl px-3 md:px-8 pb-40 md:pb-16 pt-4 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* TOOL NETWORK */}
          <section className="lg:col-span-5 rounded-2xl border border-cyan-900/30 bg-[#0B1118] p-4 md:p-6">
            <h2 className="text-cyan-300 mb-4 tracking-widest text-sm md:text-base">TOOL NETWORK</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              {["MEMORY", "SEARCH", "VISION", "PLANNER", "LLM", "SPEECH"].map((tool) => (
                <div
                  key={tool}
                  className="h-16 md:h-20 rounded-xl border border-cyan-900/30 bg-black/30 flex items-center justify-center text-xs md:text-sm tracking-wider hover:border-cyan-400/60 transition"
                >
                  {tool}
                </div>
              ))}
            </div>
          </section>

          {/* REACTOR */}
          <section className="lg:col-span-7 rounded-2xl border border-cyan-900/30 bg-[#0B1118] py-10 md:py-16">
            <div className="flex justify-center">
              <div className="relative w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] lg:w-[420px] lg:h-[420px]">
                <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-pulse" />
                <div className="absolute inset-[8%] rounded-full border-4 border-cyan-400/60" />
                <div className="absolute inset-[16%] rounded-full bg-cyan-400/20 blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full bg-cyan-400 flex items-center justify-center text-black font-bold tracking-[0.3em] text-sm md:text-base shadow-[0_0_60px_#4FD8FF]">
                    MAHA
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FLOATING MIC (mobile only — desktop uses nav) */}
      <button
        onClick={() => navigate({ to: "/voice" })}
        aria-label="Open voice agent"
        className="md:hidden fixed bottom-24 right-5 z-50 w-16 h-16 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_#4FD8FF]"
      >
        🎤
      </button>

      {/* BOTTOM NAV (mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0B1118] border-t border-cyan-900/30 flex justify-around items-center z-40">
        <button onClick={() => navigate({ to: "/" })} aria-label="Home" className="text-2xl">🏠</button>
        <button onClick={() => navigate({ to: "/chat" })} aria-label="Chat" className="text-2xl">🧠</button>
        <button aria-label="Alerts" className="text-2xl">🔔</button>
        <button onClick={() => navigate({ to: "/settings" })} aria-label="Settings" className="text-2xl">⚙️</button>
      </nav>
    </div>
  );
}