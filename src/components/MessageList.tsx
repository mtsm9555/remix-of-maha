import type { Message } from "@/types";
import { Card } from "@/components/ui/card";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
        >
          <Card
            className={`p-3 max-w-[85%] text-sm whitespace-pre-wrap ${
              message.isUser ? "bg-primary text-primary-foreground border-primary" : ""
            }`}
          >
            <p>{message.text}</p>
            <span className="mt-1 block text-[10px] opacity-60">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </Card>
        </div>
      ))}
    </div>
  );
}
