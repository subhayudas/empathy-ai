import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function PhoneCallOption() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

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
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${cleanedNumber}`;

      const { data, error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: name.trim(),
          phoneNumber: formattedPhone,
          optInCall: true,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        toast({
          title: "Failed to submit",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      setCallInitiated(true);
      
      if (data.callInitiated) {
        toast({
          title: "Call initiated!",
          description: "You will receive a call shortly. Please keep your phone ready.",
        });
      } else if (data.callError) {
        toast({
          title: "Submitted, but call failed",
          description: data.callError,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submitted!",
          description: "Your information has been saved.",
        });
      }
    } catch (error) {
      console.error("Failed to submit lead:", error);
      toast({
        title: "Failed to submit",
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
              setName("");
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
          Enter your details and we'll call you to collect your feedback
        </CardDescription>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 9876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
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
