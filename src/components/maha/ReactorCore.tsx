import { motion } from "framer-motion";

type ReactorState = "idle" | "listening" | "thinking" | "speaking";

interface ReactorCoreProps {
  state?: ReactorState;
}

export default function ReactorCore({ state = "idle" }: ReactorCoreProps) {
  const colors = {
    idle: "#4FD8FF",
    listening: "#49D17D",
    thinking: "#FF9F45",
    speaking: "#E8F6FF",
  };
  const glow = colors[state];

  return (
    <div className="relative flex items-center justify-center w-[420px] h-[420px]">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute w-[360px] h-[360px] rounded-full blur-3xl"
        style={{ background: glow }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="absolute w-[340px] h-[340px] rounded-full border"
        style={{ borderColor: glow }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
        className="absolute w-[280px] h-[280px] rounded-full border-4 border-transparent"
        style={{ borderTopColor: glow, borderRightColor: glow }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: state === "thinking" ? 3 : 10,
          ease: "linear",
        }}
        className="absolute w-[220px] h-[220px] rounded-full border-2"
        style={{ borderColor: glow }}
      />
      {state === "listening" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute w-[340px] h-[340px] rounded-full overflow-hidden"
        >
          <div
            className="absolute top-0 left-1/2 h-1/2 w-[2px] origin-bottom"
            style={{ background: "linear-gradient(to top, transparent, #49D17D)" }}
          />
        </motion.div>
      )}
      <motion.div
        animate={{ scale: state === "speaking" ? [1, 1.12, 1] : [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: state === "speaking" ? 0.8 : 3 }}
        className="absolute w-[150px] h-[150px] rounded-full"
        style={{ background: `radial-gradient(circle, ${glow}66 0%, transparent 75%)` }}
      />
      <motion.div
        animate={{ scale: state === "speaking" ? [1, 1.15, 1] : [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: state === "speaking" ? 0.7 : 2 }}
        className="absolute w-[110px] h-[110px] rounded-full flex items-center justify-center"
        style={{
          background: glow,
          boxShadow: `0 0 25px ${glow}, 0 0 60px ${glow}, 0 0 120px ${glow}`,
        }}
      >
        <span className="text-black font-bold tracking-[0.4em]">MAHA</span>
      </motion.div>
    </div>
  );
}
