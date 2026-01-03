import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, User, DoorOpen, Heart, AlertTriangle, Activity } from "lucide-react";

interface NursingResult {
  condition_summary: string;
  mood_assessment: string;
  immediate_needs: string[];
  priority_level: string;
}

interface NursingCompleteProps {
  patientName: string;
  roomNumber: string;
  result: NursingResult;
  onNewAssessment: () => void;
}

const moodIcons: Record<string, string> = {
  calm: "😌",
  content: "😊",
  anxious: "😟",
  uncomfortable: "😣",
  distressed: "😰",
};

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

export function NursingComplete({ patientName, roomNumber, result, onNewAssessment }: NursingCompleteProps) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Assessment Complete</CardTitle>
          <CardDescription>
            The nursing team has been notified of the patient's status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{patientName}</span>
            </div>
            <div className="flex items-center gap-3">
              <DoorOpen className="h-5 w-5 text-muted-foreground" />
              <span>Room {roomNumber}</span>
            </div>
          </div>

          {/* Priority Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority Level</span>
            <Badge className={priorityColors[result.priority_level] || priorityColors.low}>
              {result.priority_level.charAt(0).toUpperCase() + result.priority_level.slice(1)}
            </Badge>
          </div>

          {/* Mood */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Mood Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodIcons[result.mood_assessment] || "😐"}</span>
              <span className="capitalize">{result.mood_assessment}</span>
            </div>
          </div>

          {/* Condition Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Condition Summary</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {result.condition_summary}
            </p>
          </div>

          {/* Immediate Needs */}
          {result.immediate_needs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Immediate Needs</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.immediate_needs.map((need, index) => (
                  <Badge key={index} variant="outline">
                    {need}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button onClick={onNewAssessment} className="w-full">
            New Assessment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
