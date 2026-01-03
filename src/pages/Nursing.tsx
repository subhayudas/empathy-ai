import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ChatMessages } from "@/components/feedback/ChatMessages";
import { ChatInput } from "@/components/feedback/ChatInput";
import { NursingComplete } from "@/components/nursing/NursingComplete";
import { PatientInfoForm } from "@/components/nursing/PatientInfoForm";
import { VoiceInterface } from "@/components/nursing/VoiceInterface";
import { VideoEmotionCapture } from "@/components/nursing/VideoEmotionCapture";
import { useFeedbackChat } from "@/hooks/use-feedback-chat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stethoscope, MessageSquare, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface EmotionData {
  emotion: string;
  confidence: number;
  all_emotions: Record<string, number>;
  timestamp: string;
}

// Vapi Configuration - Get these from your Vapi dashboard
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || "";
// Create an assistant in Vapi dashboard and paste the ID here
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || "";

interface PatientInfo {
  patientName: string;
  roomNumber: string;
}

type InteractionMode = "text" | "voice";

export default function Nursing() {
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("voice");
  const [voiceMessages, setVoiceMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
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

    if (interactionMode === "text") {
      startConversation("nursing_assessment");
    }
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

  const handleVoiceTranscript = useCallback((text: string, role: "user" | "assistant") => {
    setVoiceMessages(prev => [...prev, { role, content: text }]);
    
    // Save to database
    if (sessionId) {
      supabase.from("feedback_messages").insert({
        session_id: sessionId,
        role,
        content: text,
      }).then(({ error }) => {
        if (error) console.error("Failed to save voice message:", error);
      });
    }
  }, [sessionId]);

  const handleEmotionDetected = useCallback((emotion: EmotionData) => {
    setEmotionHistory(prev => [...prev, emotion]);
  }, []);

  const handleNewAssessment = () => {
    setPatientInfo(null);
    setSessionId(null);
    setVoiceMessages([]);
    setEmotionHistory([]);
    setIsVoiceActive(false);
    resetChat();
  };

  const handleBack = () => {
    const hasMessages = interactionMode === "voice" ? voiceMessages.length > 0 : messages.length > 0;
    if (!hasMessages || confirm("Are you sure you want to leave? The assessment will not be saved.")) {
      handleNewAssessment();
    }
  };

  // Calculate dominant emotion
  const getDominantEmotion = (): { emotion: string; confidence: number } | null => {
    if (emotionHistory.length === 0) return null;
    
    const emotionCounts: Record<string, { count: number; totalConfidence: number }> = {};
    emotionHistory.forEach(e => {
      if (!emotionCounts[e.emotion]) {
        emotionCounts[e.emotion] = { count: 0, totalConfidence: 0 };
      }
      emotionCounts[e.emotion].count++;
      emotionCounts[e.emotion].totalConfidence += e.confidence;
    });

    let dominant = { emotion: "neutral", count: 0, avgConfidence: 0 };
    Object.entries(emotionCounts).forEach(([emotion, data]) => {
      if (data.count > dominant.count) {
        dominant = { emotion, count: data.count, avgConfidence: data.totalConfidence / data.count };
      }
    });

    return { emotion: dominant.emotion, confidence: dominant.avgConfidence };
  };

  // Save completion result to database
  if (nursingResult && sessionId) {
    const dominantEmotion = getDominantEmotion();
    supabase
      .from("feedback_sessions")
      .update({
        condition_summary: nursingResult.condition_summary,
        mood_assessment: nursingResult.mood_assessment,
        immediate_needs: nursingResult.immediate_needs,
        priority_level: nursingResult.priority_level,
        status: "completed",
        completed_at: new Date().toISOString(),
        emotion_history: emotionHistory as unknown as null,
        dominant_emotion: dominantEmotion?.emotion || null,
        emotion_confidence: dominantEmotion?.confidence || null,
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
          <div className="max-w-md mx-auto space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={interactionMode === "voice" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setInteractionMode("voice")}
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice (Hindi/English)
              </Button>
              <Button
                variant={interactionMode === "text" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setInteractionMode("text")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Text
              </Button>
            </div>

            {interactionMode === "voice" && (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                <p className="font-medium text-destructive">Voice Agent Not Configured</p>
                <p className="text-muted-foreground mt-1">
                  Please configure Vapi to enable voice conversations:
                  <br />1. Add <code className="bg-muted px-1 rounded">VITE_VAPI_PUBLIC_KEY</code> to .env
                  <br />2. Create an assistant in Vapi dashboard and add <code className="bg-muted px-1 rounded">VITE_VAPI_ASSISTANT_ID</code> to .env
                </p>
              </div>
            )}

            <PatientInfoForm onSubmit={handlePatientInfoSubmit} />
          </div>
        ) : nursingResult ? (
          <NursingComplete
            patientName={patientInfo.patientName}
            roomNumber={patientInfo.roomNumber}
            result={nursingResult}
            onNewAssessment={handleNewAssessment}
          />
        ) : interactionMode === "voice" ? (
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium">
                  Voice Check-In: {patientInfo.patientName} (Room {patientInfo.roomNumber})
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Voice Interface */}
              <VoiceInterface
                publicKey={VAPI_PUBLIC_KEY}
                assistantId={VAPI_ASSISTANT_ID}
                patientName={patientInfo.patientName}
                roomNumber={patientInfo.roomNumber}
                onTranscript={handleVoiceTranscript}
                onConnectionChange={setIsVoiceActive}
              />

              {/* Video Emotion Capture */}
              <VideoEmotionCapture
                isActive={isVoiceActive}
                onEmotionDetected={handleEmotionDetected}
                analysisInterval={8000}
              />
            </div>

            {/* Voice Conversation Transcript */}
            {voiceMessages.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Conversation Transcript</h3>
                <div className="space-y-3">
                  {voiceMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-sm p-2 rounded ${
                        msg.role === "user"
                          ? "bg-primary/10 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <span className="text-xs text-muted-foreground">
                        {msg.role === "user" ? "Patient" : "Assistant"}:
                      </span>
                      <p className="mt-1">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
