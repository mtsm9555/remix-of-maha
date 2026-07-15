interface Entry {
  time: string;
  message: string;
}

interface Props {
  entries?: Entry[];
}

const DEFAULT: Entry[] = [
  { time: "22:14:11", message: "Wake word detected" },
  { time: "22:14:12", message: "Loading memory" },
  { time: "22:14:13", message: "Search activated" },
  { time: "22:14:14", message: "Planner running" },
];

export default function ActivityStream({ entries = DEFAULT }: Props) {
  return (
    <div className="bg-[#0B1118] border border-[#152533] rounded-xl p-4">
      <div className="text-cyan-300 mb-3 tracking-[0.2em] text-sm">LIVE ACTIVITY</div>
      <div className="space-y-2 text-xs font-mono text-slate-300">
        {entries.map((e, i) => (
          <div key={i}>
            <span className="text-cyan-500">[{e.time}]</span> {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
