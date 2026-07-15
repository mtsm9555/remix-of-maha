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
    <div className="min-h-screen w-full max-w-screen overflow-x-hidden bg-[#05080C] text-white">
      <header className="sticky top-0 z-50 h-16 border-b border-cyan-900/30 bg-[#05080C] flex items-center justify-center">
        <h1 className="text-cyan-300 text-2xl font-bold tracking-[0.4em]">MAHA OS</h1>
      </header>

      <main className="pb-40 px-3 space-y-4">
        <section className="rounded-2xl border border-cyan-900/30 bg-[#0B1118] p-4">
          <h2 className="text-cyan-300 mb-4 tracking-widest">TOOL NETWORK</h2>
          <div className="grid grid-cols-2 gap-3">
            {["MEMORY", "SEARCH", "VISION", "PLANNER", "LLM", "SPEECH"].map((tool) => (
              <div
                key={tool}
                className="h-16 rounded-xl border border-cyan-900/30 bg-black/30 flex items-center justify-center"
              >
                {tool}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-900/30 bg-[#0B1118] py-10">
          <div className="flex justify-center">
            <div className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]">
              <div className="absolute inset-0 rounded-full border border-cyan-400/40" />
              <div className="absolute inset-[8%] rounded-full border-4 border-cyan-400/60" />
              <div className="absolute inset-[16%] rounded-full bg-cyan-400/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-cyan-400 flex items-center justify-center text-black font-bold tracking-[0.3em] shadow-[0_0_40px_#4FD8FF]">
                  MAHA
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <button
        onClick={() => navigate({ to: "/voice" })}
        aria-label="Open voice agent"
        className="fixed bottom-24 right-5 z-50 w-16 h-16 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_#4FD8FF]"
      >
        🎤
      </button>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#0B1118] border-t border-cyan-900/30 flex justify-around items-center">
        <button onClick={() => navigate({ to: "/" })} aria-label="Home">🏠</button>
        <button onClick={() => navigate({ to: "/chat" })} aria-label="Chat">🧠</button>
        <button aria-label="Alerts">🔔</button>
        <button onClick={() => navigate({ to: "/settings" })} aria-label="Settings">⚙️</button>
      </nav>
    </div>
  );
}