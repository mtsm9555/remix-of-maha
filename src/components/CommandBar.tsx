import { useState, type KeyboardEvent } from "react";
import { Paperclip, Mic, Send, Keyboard } from "lucide-react";

interface CommandBarProps {
  onSend?: (message: string) => void;
  onVoice?: () => void;
  onAttach?: () => void;
}

export default function CommandBar({ onSend, onVoice, onAttach }: CommandBarProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSend?.(message);
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="commandbar-wrapper">
      <div className="commandbar">
        <button className="cmd-icon-btn" onClick={onAttach} aria-label="Attach file" type="button">
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          placeholder="Ask MAHA anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="command-input"
          aria-label="Ask MAHA"
        />
        <button className="cmd-icon-btn" aria-label="Keyboard" type="button">
          <Keyboard size={18} />
        </button>
        <button className="voice-btn" onClick={onVoice} aria-label="Voice input" type="button">
          <Mic size={20} />
        </button>
        <button className="send-btn" onClick={handleSend} aria-label="Send" type="button">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}