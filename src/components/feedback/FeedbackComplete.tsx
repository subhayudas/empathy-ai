import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeedbackCompleteProps {
  score: number;
  summary: string;
  onNewFeedback: () => void;
}

export function FeedbackComplete({ score, summary, onNewFeedback }: FeedbackCompleteProps) {
  const navigate = useNavigate();

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Thank You for Your Feedback!</CardTitle>
        <CardDescription>Your input helps us improve our services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Your satisfaction score</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 ${
                  star <= score
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-2xl font-bold mt-2">{score}/5</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Summary</p>
          <p className="text-sm">{summary}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onNewFeedback} className="w-full">
            Submit Another Feedback
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            Return Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
