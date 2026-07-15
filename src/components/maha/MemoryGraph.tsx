import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

function nodeStyle(color = "#16232E") {
  return {
    background: "#0B1118",
    color: "#E8F6FF",
    border: `1px solid ${color}`,
    borderRadius: "12px",
    padding: 12,
    minWidth: 120,
    textAlign: "center" as const,
    boxShadow: `0 0 20px ${color}55`,
  };
}

function edge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#4FD8FF", strokeWidth: 2 },
  };
}

const nodes: Node[] = [
  { id: "user", position: { x: 400, y: 250 }, data: { label: "USER" }, style: nodeStyle("#4FD8FF") },
  { id: "maha", position: { x: 650, y: 250 }, data: { label: "MAHA" }, style: nodeStyle("#4FD8FF") },
  { id: "react", position: { x: 400, y: 60 }, data: { label: "React" }, style: nodeStyle() },
  { id: "ai", position: { x: 650, y: 60 }, data: { label: "AI" }, style: nodeStyle() },
  { id: "startup", position: { x: 220, y: 250 }, data: { label: "Startup" }, style: nodeStyle() },
  { id: "project", position: { x: 400, y: 450 }, data: { label: "Projects" }, style: nodeStyle() },
  { id: "tools", position: { x: 650, y: 450 }, data: { label: "Tools" }, style: nodeStyle() },
];

const edges: Edge[] = [
  edge("user", "react"),
  edge("user", "startup"),
  edge("user", "project"),
  edge("user", "ai"),
  edge("user", "maha"),
  edge("maha", "tools"),
];

export default function MemoryGraph() {
  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-[#152533] bg-[#05080C]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#152533" gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
