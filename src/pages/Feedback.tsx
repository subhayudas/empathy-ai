import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { CategorySelector } from "@/components/feedback/CategorySelector";
import { ChatMessages } from "@/components/feedback/ChatMessages";
import { ChatInput } from "@/components/feedback/ChatInput";
import { FeedbackComplete } from "@/components/feedback/FeedbackComplete";
import { useFeedbackChat } from "@/hooks/use-feedback-chat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type FeedbackCategory = "post_visit" | "treatment_experience" | "service_quality";

export default function Feedback() {
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { messages, isLoading, feedbackResult, sendMessage, startConversation, resetChat } = useFeedbackChat();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCategorySelect = async (selectedCategory: string) => {
    setCategory(selectedCategory as FeedbackCategory);
    
    // Create session in database
    try {
      const { data, error } = await supabase
        .from("feedback_sessions")
        .insert({
          user_id: user?.id || null,
          category: selectedCategory as FeedbackCategory,
          status: "in_progress",
        })
        .select("id")
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error) {
      console.error("Failed to create session:", error);
    }

    startConversation(selectedCategory);
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, category!, sessionId || undefined);
    
    // Save message to database
    if (sessionId) {
      try {
        await supabase.from("feedback_messages").insert({
          session_id: sessionId,
          role: "user",
          content: message,
        });
      } catch (error) {
        console.error("Failed to save message:", error);
      }
    }
  };

  const handleNewFeedback = () => {
    setCategory(null);
    setSessionId(null);
    resetChat();
  };

  const handleBack = () => {
    if (messages.length === 0 || confirm("Are you sure you want to leave? Your feedback will not be saved.")) {
      handleNewFeedback();
    }
  };

  // Save completion result to database
  if (feedbackResult && sessionId) {
    supabase
      .from("feedback_sessions")
      .update({
        satisfaction_score: feedbackResult.score,
        summary: feedbackResult.summary,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .then(({ error }) => {
        if (error) console.error("Failed to update session:", error);
      });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {!category ? (
          <CategorySelector onSelect={handleCategorySelect} />
        ) : feedbackResult ? (
          <FeedbackComplete
            score={feedbackResult.score}
            summary={feedbackResult.summary}
            onNewFeedback={handleNewFeedback}
          />
        ) : (
          <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h2 className="text-lg font-medium">
                {category === "post_visit" && "Post-Visit Feedback"}
                {category === "treatment_experience" && "Treatment Experience"}
                {category === "service_quality" && "Service Quality"}
              </h2>
            </div>
            
            <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
              <ChatMessages messages={messages} isLoading={isLoading} />
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                disabled={!messages.length}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
