import { motion } from "framer-motion";

type ReactorState = "idle" | "listening" | "thinking" | "speaking";

interface ReactorCoreProps {
  state?: ReactorState;
}

const colors: Record<ReactorState, string> = {
  idle: "#00d9ff",
  listening: "#00ffb3",
  thinking: "#6aa8ff",
  speaking: "#ffc857",
};

export default function ReactorCore({ state = "idle" }: ReactorCoreProps) {
  const color = colors[state];

  return (
    <div className="reactor-container">
      <motion.div
        className="ring ring-outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ borderColor: color, boxShadow: `0 0 40px ${color}` }}
      />
      <motion.div
        className="ring ring-middle"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ borderColor: color }}
      />
      <motion.div
        className="ring ring-inner"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ borderColor: color }}
      />
      <motion.div
        className="core-glow"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ background: color }}
      />
      <motion.div
        className="core-center"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div
          className="core-inner"
          style={{
            background: color,
            boxShadow: `0 0 30px ${color}, 0 0 80px ${color}, 0 0 120px ${color}`,
          }}
        />
        <div className="core-text">
          <h2>MAHA</h2>
          <span>{state.toUpperCase()}</span>
        </div>
      </motion.div>
      <motion.div
        className="orbit orbit-1"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <span className="node" style={{ background: color, color }} />
      </motion.div>
      <motion.div
        className="orbit orbit-2"
        animate={{ rotate: -360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      >
        <span className="node" style={{ background: color, color }} />
      </motion.div>
      <motion.div
        className="scan-line"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}