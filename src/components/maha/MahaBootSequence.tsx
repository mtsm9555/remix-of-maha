import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_STEPS = [
  "INITIALIZING MAHA CORE...",
  "LOADING MEMORY SYSTEM...",
  "CONNECTING EVENT BUS...",
  "STARTING PLANNER AGENT...",
  "STARTING VOICE ENGINE...",
  "LOADING TOOL NETWORK...",
  "CONNECTING KNOWLEDGE GRAPH...",
  "STARTING REACTOR CORE...",
  "SYSTEMS ONLINE",
];

interface Props {
  onComplete?: () => void;
}

export default function MahaBootSequence({
  onComplete,
}: Props) {
  const [currentStep, setCurrentStep] =
    useState(0);

  useEffect(() => {
    if (
      currentStep >= BOOT_STEPS.length
    ) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1000);

      return () =>
        clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCurrentStep((p) => p + 1);
    }, 700);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  const progress =
    (currentStep /
      BOOT_STEPS.length) *
    100;

  return (
    <div className="fixed inset-0 bg-[#05080C] flex items-center justify-center overflow-hidden">

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(79,216,255,0.15) 3px)",
        }}
      />

      {/* Reactor Glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
        }}
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
        style={{
          background:
            "#4FD8FF",
        }}
      />

      <div className="relative z-10 w-[800px]">

        {/* Logo */}
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold tracking-[0.5em] text-cyan-300">
            MAHA
          </h1>

          <div className="text-cyan-500 mt-2 tracking-[0.4em]">
            ARTIFICIAL INTELLIGENCE SYSTEM
          </div>
        </motion.div>

        {/* Terminal */}
        <div className="bg-[#081018] border border-[#152533] rounded-xl p-6 font-mono text-sm h-[320px] overflow-hidden">

          {BOOT_STEPS.slice(
            0,
            currentStep
          ).map((line, index) => (
            <motion.div
              key={line}
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              className="mb-2 text-cyan-300"
            >
              [{String(index + 1).padStart(
                2,
                "0"
              )}]
              {" "}
              {line}
            </motion.div>
          ))}

          <AnimatePresence>
            {currentStep <
              BOOT_STEPS.length && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="text-white"
              >
                {'>'}

                {" "}
                {
                  BOOT_STEPS[
                    currentStep
                  ]
                }
                <span className="animate-pulse">
                  _
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress */}
        <div className="mt-8">

          <div className="flex justify-between text-xs text-cyan-300 mb-2">
            <span>
              SYSTEM BOOT
            </span>

            <span>
              {Math.floor(
                progress
              )}
              %
            </span>
          </div>

          <div className="h-2 bg-[#152533] rounded-full overflow-hidden">

            <motion.div
              animate={{
                width: `${progress}%`,
              }}
              className="h-full bg-cyan-400"
            />
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 flex justify-center">
          <div className="text-cyan-300 text-sm tracking-[0.25em]">
            STATUS:
            {" "}
            {currentStep >=
            BOOT_STEPS.length
              ? "ONLINE"
              : "INITIALIZING"}
          </div>
        </div>
      </div>
    </div>
  );
}