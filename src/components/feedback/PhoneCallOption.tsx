import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink } from "lucide-react";

const EXTERNAL_CALL_URL = "https://vitalsenseagent.netlify.app";

export function PhoneCallOption() {
  const handleGetCall = () => {
    window.open(EXTERNAL_CALL_URL, "_blank");
  };

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
          Click below to schedule a call and share your feedback over the phone
        </CardDescription>
        <Button className="w-full" onClick={handleGetCall}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Get a Call
        </Button>
      </CardContent>
    </Card>
  );
}
