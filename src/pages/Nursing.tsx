import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ChatMessages } from "@/components/feedback/ChatMessages";
import { ChatInput } from "@/components/feedback/ChatInput";
import { NursingComplete } from "@/components/nursing/NursingComplete";
import { PatientInfoForm } from "@/components/nursing/PatientInfoForm";
import { useFeedbackChat } from "@/hooks/use-feedback-chat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface PatientInfo {
  patientName: string;
  roomNumber: string;
}

export default function Nursing() {
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { messages, isLoading, nursingResult, sendMessage, startConversation, resetChat } = useFeedbackChat();
  const { user } = useAuth();

  const handlePatientInfoSubmit = async (info: PatientInfo) => {
    setPatientInfo(info);
    
    try {
      const { data, error } = await supabase
        .from("feedback_sessions")
        .insert({
          user_id: user?.id || null,
          category: "nursing_assessment",
          status: "in_progress",
          patient_name: info.patientName,
          room_number: info.roomNumber,
          is_nursing_assessment: true,
        })
        .select("id")
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error) {
      console.error("Failed to create session:", error);
    }

    startConversation("nursing_assessment");
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, "nursing_assessment", sessionId || undefined);
    
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

  const handleNewAssessment = () => {
    setPatientInfo(null);
    setSessionId(null);
    resetChat();
  };

  const handleBack = () => {
    if (messages.length === 0 || confirm("Are you sure you want to leave? The assessment will not be saved.")) {
      handleNewAssessment();
    }
  };

  // Save completion result to database
  if (nursingResult && sessionId) {
    supabase
      .from("feedback_sessions")
      .update({
        condition_summary: nursingResult.condition_summary,
        mood_assessment: nursingResult.mood_assessment,
        immediate_needs: nursingResult.immediate_needs,
        priority_level: nursingResult.priority_level,
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
        {!patientInfo ? (
          <PatientInfoForm onSubmit={handlePatientInfoSubmit} />
        ) : nursingResult ? (
          <NursingComplete
            patientName={patientInfo.patientName}
            roomNumber={patientInfo.roomNumber}
            result={nursingResult}
            onNewAssessment={handleNewAssessment}
          />
        ) : (
          <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium">
                  Nursing Check-In: {patientInfo.patientName} (Room {patientInfo.roomNumber})
                </h2>
              </div>
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
