import { useState, useCallback, useEffect, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInterfaceProps {
  publicKey: string;
  assistantId: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onAssessmentComplete?: (result: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  patientName: string;
  roomNumber: string;
}

const NURSING_ASSISTANT_PROMPT = `You are a compassionate nursing assistant conducting a patient check-in. 
You can speak in both Hindi and English - use whichever language the patient prefers.
Your goal is to:
1. Ask how the patient is feeling today
2. Check if they have any pain or discomfort (ask them to rate it 1-10 if they do)
3. Ask about their sleep quality
4. Check if they need anything (water, food, help with bathroom, etc.)
5. Ask about their mood and emotional state

Be warm, patient, and empathetic. Keep your responses concise but caring.
If the patient speaks in Hindi, respond in Hindi. If they speak in English, respond in English.

After gathering all the information, summarize the key findings.`;

export function VoiceInterface({
  publicKey,
  assistantId,
  onTranscript,
  onAssessmentComplete,
  onConnectionChange,
  patientName,
  roomNumber,
}: VoiceInterfaceProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      console.log("Vapi call started");
      setIsConnected(true);
      setIsConnecting(false);
      onConnectionChange?.(true);
      toast({
        title: "Connected",
        description: "Voice assistant is ready. Start speaking!",
      });
    });

    vapi.on("call-end", () => {
      console.log("Vapi call ended");
      setIsConnected(false);
      setIsSpeaking(false);
      onConnectionChange?.(false);
    });

    vapi.on("speech-start", () => {
      setIsSpeaking(true);
    });

    vapi.on("speech-end", () => {
      setIsSpeaking(false);
    });

    vapi.on("message", (message: any) => {
      console.log("Vapi message:", message);
      
      if (message.type === "transcript") {
        if (message.transcriptType === "final" && onTranscript) {
          onTranscript(message.transcript, message.role === "user" ? "user" : "assistant");
        }
      }
    });

    vapi.on("error", (error: any) => {
      console.error("Vapi error:", error);
      setIsConnecting(false);
      setIsConnected(false);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error?.message || "Failed to connect to voice assistant. Please try again.",
      });
    });

    return () => {
      vapi.stop();
    };
  }, [publicKey, onTranscript, onConnectionChange, toast]);

  const startConversation = useCallback(async () => {
    if (!vapiRef.current || !publicKey || !assistantId) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Voice assistant is not configured properly. Please provide an assistant ID.",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Use the pre-configured assistant ID instead of transient assistant
      await vapiRef.current.start(assistantId, {
        variableValues: {
          patientName: patientName,
          roomNumber: roomNumber,
        },
      });
    } catch (error) {
      console.error("Failed to start Vapi conversation:", error);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not start voice conversation",
      });
    }
  }, [publicKey, assistantId, patientName, roomNumber, toast]);

  const stopConversation = useCallback(async () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Volume2 className="h-5 w-5" />
        <span className="text-sm">
          {isConnected
            ? isSpeaking
              ? "Assistant is speaking..."
              : "Listening..."
            : "Voice Assistant"}
        </span>
      </div>

      <div className="relative">
        {isConnected && (
          <div
            className={`absolute inset-0 rounded-full ${
              isSpeaking
                ? "bg-primary/20 animate-pulse"
                : "bg-green-500/20 animate-pulse"
            }`}
            style={{ transform: "scale(1.5)" }}
          />
        )}
        <Button
          size="lg"
          variant={isConnected ? "destructive" : "default"}
          className="relative z-10 h-20 w-20 rounded-full"
          onClick={isConnected ? stopConversation : startConversation}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isConnected ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {isConnected
          ? "Tap to end the conversation"
          : "Tap to start speaking with the voice assistant in Hindi or English"}
      </p>

      {isConnected && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div
            className={`h-2 w-2 rounded-full ${
              isSpeaking ? "bg-primary" : "bg-green-500"
            }`}
          />
          <span>{isSpeaking ? "Speaking" : "Listening"}</span>
        </div>
      )}
    </div>
  );
}
