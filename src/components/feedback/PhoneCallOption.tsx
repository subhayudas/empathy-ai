import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function PhoneCallOption() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const { toast } = useToast();

  const handleCallRequest = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to receive a call.",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    if (cleanedNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        toast({
          title: "Calling is not configured",
          description: "Missing Vapi Assistant ID configuration.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("vapi-outbound-call", {
        body: {
          phoneNumber: phoneNumber.startsWith("+") ? phoneNumber : `+${cleanedNumber}`,
          assistantId,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        toast({
          title: "Failed to initiate call",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      setCallInitiated(true);
      toast({
        title: "Call initiated!",
        description: "You will receive a call shortly. Please keep your phone ready.",
      });
    } catch (error) {
      console.error("Failed to initiate call:", error);
      toast({
        title: "Failed to initiate call",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (callInitiated) {
    return (
      <Card className="max-w-md mx-auto border-primary/50 bg-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Call Incoming!</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-center">
            We're calling you at {phoneNumber}. Please answer to share your feedback.
          </CardDescription>
          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={() => {
              setCallInitiated(false);
              setPhoneNumber("");
            }}
          >
            Request Another Call
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Get a Call Instead</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center mb-4">
          Enter your phone number and we'll call you to collect your feedback
        </CardDescription>
        <div className="space-y-3">
          <Input
            type="tel"
            placeholder="+91 9876543210"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-center"
          />
          <Button 
            className="w-full" 
            onClick={handleCallRequest}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initiating Call...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Call Me
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
