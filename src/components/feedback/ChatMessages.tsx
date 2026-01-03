import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[80%] rounded-lg px-4 py-3",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground border border-border"
            )}
          >
            <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
      
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex justify-start">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
