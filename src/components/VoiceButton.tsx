import { Mic, MicOff } from "lucide-react";

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceButton({ isListening, onClick, disabled }: VoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
      className={`grid h-12 w-12 place-items-center rounded-full text-primary-foreground transition-colors disabled:opacity-50 ${
        isListening
          ? "bg-destructive animate-pulse"
          : "bg-primary hover:bg-primary/90"
      }`}
    >
      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
}
