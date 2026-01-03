import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, PhoneCall, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OutboundCallInterfaceProps {
  assistantId: string;
  patientName: string;
  roomNumber: string;
  onCallStarted?: (callId: string) => void;
}

export function OutboundCallInterface({
  assistantId,
  patientName,
  roomNumber,
  onCallStarted,
}: OutboundCallInterfaceProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Phone Number Required",
        description: "Please enter a valid phone number.",
      });
      return;
    }

    // Format phone number - ensure it starts with country code
    let formattedNumber = phoneNumber.trim().replace(/\s+/g, "");
    if (!formattedNumber.startsWith("+")) {
      // Assume India (+91) if no country code provided
      formattedNumber = "+91" + formattedNumber.replace(/^0+/, "");
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("vapi-outbound-call", {
        body: {
          phoneNumber: formattedNumber,
          patientName,
          roomNumber,
          assistantId,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setCallId(data.callId);
      onCallStarted?.(data.callId);

      toast({
        title: "Call Initiated",
        description: `Calling ${formattedNumber}. The patient will receive a call shortly.`,
      });
    } catch (error) {
      console.error("Failed to initiate call:", error);
      toast({
        variant: "destructive",
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Could not initiate the call. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-card border border-border rounded-lg max-w-md mx-auto">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Phone className="h-5 w-5" />
        <span className="text-sm font-medium">Outbound Voice Call</span>
      </div>

      <div className="w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Patient Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 9876543210"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading || !!callId}
          />
          <p className="text-xs text-muted-foreground">
            Enter with country code (e.g., +91 for India) or we'll add +91 automatically
          </p>
        </div>

        {!callId ? (
          <Button
            onClick={handleStartCall}
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Initiating Call...
              </>
            ) : (
              <>
                <PhoneCall className="h-4 w-4 mr-2" />
                Start Voice Call
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 font-medium">Call in Progress</span>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              The patient is receiving a call from the voice assistant.
              The assessment will be recorded automatically.
            </p>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        The voice assistant will call the patient and conduct the nursing check-in in Hindi or English.
      </p>
    </div>
  );
}
