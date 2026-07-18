// src/components/ReactorCore.tsx

import { motion } from "framer-motion";

type ReactorState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

interface ReactorCoreProps {
  state?: ReactorState;
}

export default function ReactorCore({
  state = "idle",
}: ReactorCoreProps) {
  const getStateClass = () => {
    switch (state) {
      case "listening":
        return "reactor-listening";

      case "thinking":
        return "reactor-thinking";

      case "speaking":
        return "reactor-speaking";

      default:
        return "reactor-idle";
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[500px] h-[500px]">

      {/* OUTER RING */}
      <motion.div
        className="absolute w-[460px] h-[460px] rounded-full border border-cyan-400/20"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 45,
          ease: "linear",
        }}
      />

      {/* RING 2 */}
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full border border-cyan-300/15"
        animate={{ rotate: -360 }}
        transition={{
          repeat: Infinity,
          duration: 30,
          ease: "linear",
        }}
      />

      {/* RING 3 */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full border border-cyan-400/25"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "linear",
        }}
      />

      {/* ENERGY PULSE */}
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full border border-cyan-400/20"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 0.1, 0.8],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
        }}
      />

      {/* REACTOR CORE */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
        }}
        className={`
          relative
          w-[180px]
          h-[180px]
          rounded-full
          flex
          items-center
          justify-center
          ${getStateClass()}
        `}
      >
        {/* INNER GLOW */}
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-3xl" />

        {/* CORE CENTER */}
        <div
          className="
          w-[120px]
          h-[120px]
          rounded-full
          bg-gradient-to-br
          from-cyan-300
          via-cyan-500
          to-blue-700
          shadow-[0_0_80px_rgba(0,234,255,.8)]
        "
        />

        {/* LABEL */}
        <div className="absolute text-center">
          <h2 className="text-white text-sm font-semibold tracking-[6px]">
            MAHA
          </h2>

          <p className="text-cyan-300 text-[10px] mt-1 tracking-[3px]">
            AI CORE
          </p>
        </div>
      </motion.div>

      {/* ORBIT NODES */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="
            absolute
            w-3
            h-3
            rounded-full
            bg-cyan-300
            shadow-[0_0_20px_rgba(0,234,255,.9)]
          "
          animate={{
            rotate: 360,
          }}
          transition={{
            repeat: Infinity,
            duration: 12 + i * 2,
            ease: "linear",
          }}
          style={{
            transformOrigin: "0px 160px",
          }}
        />
      ))}
    </div>
  );
}