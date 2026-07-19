import { AnimatePresence, motion } from "framer-motion";
import { STATE_COLORS } from "@/lib/stateColors";
import type { AIState } from "@/services/stateMachine";

interface Props {
  state: AIState;
}

export default function StateTransition({ state }: Props) {
  const color = STATE_COLORS[state];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.9, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1, y: -6 }}
        transition={{ duration: 0.35 }}
        className="state-label"
        style={{ color, textShadow: `0 0 12px ${color}` }}
      >
        {state.toUpperCase()}
      </motion.div>
    </AnimatePresence>
  );
}