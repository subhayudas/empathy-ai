import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope } from "lucide-react";

interface PatientInfoFormProps {
  onSubmit: (info: { patientName: string; roomNumber: string }) => void;
}

export function PatientInfoForm({ onSubmit }: PatientInfoFormProps) {
  const [patientName, setPatientName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientName.trim() && roomNumber.trim()) {
      onSubmit({ patientName: patientName.trim(), roomNumber: roomNumber.trim() });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Nursing Check-In</CardTitle>
          <CardDescription>
            Enter patient information to begin the wellness assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                placeholder="Enter patient's name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                placeholder="e.g., 205A"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!patientName.trim() || !roomNumber.trim()}>
              Start Assessment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
