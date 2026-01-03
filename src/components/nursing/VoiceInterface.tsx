import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceInterfaceProps {
  agentId: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onAssessmentComplete?: (result: any) => void;
  patientName: string;
  roomNumber: string;
}

export function VoiceInterface({
  agentId,
  onTranscript,
  onAssessmentComplete,
  patientName,
  roomNumber,
}: VoiceInterfaceProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast({
        title: "Connected",
        description: "Voice assistant is ready. Start speaking!",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
    },
    onMessage: (message: any) => {
      console.log("Message from agent:", message);
      
      // Handle transcriptions
      if (message.type === "user_transcript") {
        const userText = message.user_transcription_event?.user_transcript;
        if (userText && onTranscript) {
          onTranscript(userText, "user");
        }
      } else if (message.type === "agent_response") {
        const agentText = message.agent_response_event?.agent_response;
        if (agentText && onTranscript) {
          onTranscript(agentText, "assistant");
        }
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to voice assistant. Please try again.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    if (!agentId) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Voice agent ID is not configured.",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        {
          body: { agentId },
        }
      );

      if (error || !data?.signed_url) {
        throw new Error(error?.message || "No signed URL received");
      }

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not start voice conversation",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Volume2 className="h-5 w-5" />
        <span className="text-sm">
          {conversation.status === "connected"
            ? conversation.isSpeaking
              ? "Assistant is speaking..."
              : "Listening..."
            : "Voice Assistant"}
        </span>
      </div>

      <div className="relative">
        {conversation.status === "connected" && (
          <div
            className={`absolute inset-0 rounded-full ${
              conversation.isSpeaking
                ? "bg-primary/20 animate-pulse"
                : "bg-green-500/20 animate-pulse"
            }`}
            style={{ transform: "scale(1.5)" }}
          />
        )}
        <Button
          size="lg"
          variant={conversation.status === "connected" ? "destructive" : "default"}
          className="relative z-10 h-20 w-20 rounded-full"
          onClick={
            conversation.status === "connected"
              ? stopConversation
              : startConversation
          }
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : conversation.status === "connected" ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {conversation.status === "connected"
          ? "Tap to end the conversation"
          : "Tap to start speaking with the voice assistant in Hindi or English"}
      </p>

      {conversation.status === "connected" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div
            className={`h-2 w-2 rounded-full ${
              conversation.isSpeaking ? "bg-primary" : "bg-green-500"
            }`}
          />
          <span>
            {conversation.isSpeaking ? "Speaking" : "Listening"}
          </span>
        </div>
      )}
    </div>
  );
}
