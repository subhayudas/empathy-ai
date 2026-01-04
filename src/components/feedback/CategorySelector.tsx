import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Phone, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EXTERNAL_CALL_URL = "https://vitalsenseagent.netlify.app";

export function CategorySelector() {
  const navigate = useNavigate();

  const handleGetCall = () => {
    window.open(EXTERNAL_CALL_URL, "_blank");
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">How would you like to share your feedback?</h2>
        <p className="text-muted-foreground mt-2">Choose an option below</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
        {/* Nursing Staff Option */}
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
          onClick={() => navigate("/nursing")}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">For Nursing Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Assess patient condition, mood, and immediate needs with AI-powered analysis
            </CardDescription>
            <Button className="w-full mt-4" variant="outline">
              Start Assessment
            </Button>
          </CardContent>
        </Card>

        {/* Phone Call Option */}
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
          onClick={handleGetCall}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Prefer a Phone Call?</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              We'll call you to collect your feedback over the phone
            </CardDescription>
            <Button className="w-full mt-4" variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Get a Call
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
