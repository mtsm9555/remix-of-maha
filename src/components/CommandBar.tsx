import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Paperclip, Mic, Send, Keyboard, Loader2 } from "lucide-react";

export interface CommandBarHandle {
  focus: () => void;
  setValue: (v: string) => void;
}

interface CommandBarProps {
  onSend?: (message: string) => void;
  onVoice?: () => void;
  onAttach?: () => void;
  onKeyboard?: () => void;
  isVoiceActive?: boolean;
  isBusy?: boolean;
  id?: string;
}

const CommandBar = forwardRef<CommandBarHandle, CommandBarProps>(function CommandBar(
  { onSend, onVoice, onAttach, onKeyboard, isVoiceActive, isBusy, id },
  ref,
) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setValue: (v: string) => setMessage(v),
  }));

  const handleSend = () => {
    const text = message.trim();
    if (!text || isBusy) return;
    onSend?.(text);
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleKeyboardBtn = () => {
    if (onKeyboard) onKeyboard();
    else inputRef.current?.focus();
  };

  return (
    <div className="commandbar-wrapper" role="region" aria-label="Command input">
      <div className="commandbar">
        <button
          className="cmd-icon-btn"
          onClick={onAttach}
          aria-label="Attach file"
          type="button"
          disabled={isBusy}
        >
          <Paperclip size={18} />
        </button>
        <input
          id={id}
          ref={inputRef}
          type="text"
          placeholder={isVoiceActive ? "Listening…" : "Ask MAHA anything..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="command-input"
          aria-label="Ask MAHA"
          autoComplete="off"
          enterKeyHint="send"
          disabled={isBusy}
        />
        <button
          className="cmd-icon-btn"
          onClick={handleKeyboardBtn}
          aria-label="Focus input"
          type="button"
        >
          <Keyboard size={18} />
        </button>
        <button
          className={`voice-btn ${isVoiceActive ? "active" : ""}`}
          onClick={onVoice}
          aria-label={isVoiceActive ? "Stop recording" : "Start voice input"}
          aria-pressed={isVoiceActive}
          type="button"
          disabled={isBusy && !isVoiceActive}
        >
          <Mic size={20} />
        </button>
        <button
          className="send-btn"
          onClick={handleSend}
          aria-label="Send"
          type="button"
          disabled={isBusy || !message.trim()}
        >
          {isBusy ? <Loader2 size={18} className="cb-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
});

export default CommandBar;