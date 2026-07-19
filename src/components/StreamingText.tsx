import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useStreamingText } from "@/hooks/useStreamingText";
import "./StreamingText.css";

interface Props {
  text: string;
  speed?: number;
  showCursor?: boolean;
}

export default function StreamingText({ text, speed = 15, showCursor = true }: Props) {
  const displayed = useStreamingText(text, speed);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [displayed]);

  return (
    <div className="streaming-text" ref={ref}>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {displayed}
        {showCursor && displayed.length < text.length && (
          <span className="cursor">▋</span>
        )}
      </motion.p>
    </div>
  );
}