import { Paperclip, Mic } from "lucide-react";
import { useState } from "react";

export default function CommandBar() {
  const [value, setValue] = useState("");
  return (
    <form
      className="command-bar"
      onSubmit={(e) => {
        e.preventDefault();
        setValue("");
      }}
    >
      <button type="button" className="cmd-icon" aria-label="Attach file">
        <Paperclip size={18} />
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask MAHA..."
        aria-label="Ask MAHA"
      />
      <button type="button" className="cmd-icon cmd-mic" aria-label="Voice input">
        <Mic size={18} />
      </button>
    </form>
  );
}