import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

interface FeedbackResult {
  score: number;
  summary: string;
}

interface NursingResult {
  condition_summary: string;
  mood_assessment: string;
  immediate_needs: string[];
  priority_level: string;
}

export function useFeedbackChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);
  const [nursingResult, setNursingResult] = useState<NursingResult | null>(null);
  const { toast } = useToast();

  const parseFeedbackResult = (content: string): FeedbackResult | null => {
    const match = content.match(/\[FEEDBACK_SUMMARY\]([\s\S]*?)\[\/FEEDBACK_SUMMARY\]/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  };

  const parseNursingResult = (content: string): NursingResult | null => {
    const match = content.match(/\[NURSING_ASSESSMENT\]([\s\S]*?)\[\/NURSING_ASSESSMENT\]/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  };

  const cleanContent = (content: string): string => {
    return content
      .replace(/\[COMPLETE\]/g, "")
      .replace(/\[FEEDBACK_SUMMARY\][\s\S]*?\[\/FEEDBACK_SUMMARY\]/g, "")
      .replace(/\[NURSING_ASSESSMENT\][\s\S]*?\[\/NURSING_ASSESSMENT\]/g, "")
      .trim();
  };

  const sendMessage = useCallback(
    async (input: string, category: string, sessionId?: string) => {
      const userMsg: Message = { role: "user", content: input };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let assistantContent = "";

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [...messages, userMsg],
              category,
              sessionId,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to get response");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) =>
                      i === prev.length - 1
                        ? { ...m, content: cleanContent(assistantContent) }
                        : m
                    );
                  }
                  return [...prev, { role: "assistant", content: cleanContent(assistantContent) }];
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Check for completion
        const feedbackRes = parseFeedbackResult(assistantContent);
        if (feedbackRes) {
          setFeedbackResult(feedbackRes);
        }
        const nursingRes = parseNursingResult(assistantContent);
        if (nursingRes) {
          setNursingResult(nursingRes);
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to send message",
        });
        setMessages((prev) => prev.slice(0, -1)); // Remove the user message on error
      } finally {
        setIsLoading(false);
      }
    },
    [messages, toast]
  );

  const startConversation = useCallback(
    async (category: string) => {
      setMessages([]);
      setFeedbackResult(null);
      setIsLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [],
              category,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to start conversation");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let assistantContent = "";

        setMessages([{ role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages([{ role: "assistant", content: cleanContent(assistantContent) }]);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } catch (error) {
        console.error("Start conversation error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to start conversation",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setFeedbackResult(null);
    setNursingResult(null);
  }, []);

  return {
    messages,
    isLoading,
    feedbackResult,
    nursingResult,
    sendMessage,
    startConversation,
    resetChat,
  };
}
