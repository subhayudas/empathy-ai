import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, HeartPulse, Users } from "lucide-react";

interface CategorySelectorProps {
  onSelect: (category: string) => void;
}

const categories = [
  {
    id: "post_visit",
    title: "Post-Visit Satisfaction",
    description: "Share your overall experience from your recent visit",
    icon: ClipboardCheck,
  },
  {
    id: "treatment_experience",
    title: "Treatment Experience",
    description: "Tell us about your treatment and care quality",
    icon: HeartPulse,
  },
  {
    id: "service_quality",
    title: "Service Quality",
    description: "Rate our staff, facilities, and general service",
    icon: Users,
  },
];

export function CategorySelector({ onSelect }: CategorySelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">What would you like to share feedback about?</h2>
        <p className="text-muted-foreground mt-2">Select a category to start the conversation</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
              onClick={() => onSelect(category.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">{category.description}</CardDescription>
                <Button className="w-full mt-4" variant="outline">
                  Start Feedback
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
