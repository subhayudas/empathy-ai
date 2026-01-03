import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmotionData {
  emotion: string;
  confidence: number;
  all_emotions: Record<string, number>;
  timestamp: string;
}

interface VideoEmotionCaptureProps {
  isActive: boolean;
  onEmotionDetected?: (emotion: EmotionData) => void;
  analysisInterval?: number; // in milliseconds
}

const EMOTION_EMOJIS: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  anxious: "😰",
  calm: "😌",
  pain: "😣",
  neutral: "😐",
  confused: "😕",
  unknown: "❓",
};

const EMOTION_COLORS: Record<string, string> = {
  happy: "bg-green-500",
  sad: "bg-blue-500",
  anxious: "bg-yellow-500",
  calm: "bg-teal-500",
  pain: "bg-red-500",
  neutral: "bg-gray-500",
  confused: "bg-purple-500",
  unknown: "bg-gray-400",
};

export function VideoEmotionCapture({
  isActive,
  onEmotionDetected,
  analysisInterval = 8000, // Analyze every 8 seconds
}: VideoEmotionCaptureProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setIsVideoEnabled(true);
    } catch (error) {
      console.error("Camera access denied:", error);
      setHasPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please enable camera access to use emotion detection.",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsVideoEnabled(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const analyzeEmotion = useCallback(async () => {
    if (!isVideoEnabled || isAnalyzing) return;

    const frame = captureFrame();
    if (!frame) return;

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-emotion", {
        body: { image: frame },
      });

      if (error) {
        console.error("Emotion analysis error:", error);
        return;
      }

      if (data && data.emotion !== "unknown") {
        setCurrentEmotion(data);
        onEmotionDetected?.(data);
      }
    } catch (error) {
      console.error("Failed to analyze emotion:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isVideoEnabled, isAnalyzing, captureFrame, onEmotionDetected]);

  // Start/stop camera based on isActive prop
  useEffect(() => {
    if (isActive && !isVideoEnabled) {
      startCamera();
    } else if (!isActive && isVideoEnabled) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, isVideoEnabled, startCamera, stopCamera]);

  // Set up analysis interval
  useEffect(() => {
    if (isVideoEnabled) {
      // Initial analysis after 2 seconds
      const initialTimeout = setTimeout(analyzeEmotion, 2000);
      
      intervalRef.current = setInterval(analyzeEmotion, analysisInterval);
      
      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isVideoEnabled, analyzeEmotion, analysisInterval]);

  const toggleCamera = () => {
    if (isVideoEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Video Preview */}
      <div className="relative rounded-lg overflow-hidden bg-muted aspect-video max-w-xs mx-auto">
        {isVideoEnabled ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Emotion Badge */}
            {currentEmotion && (
              <div
                className={`absolute top-2 right-2 ${
                  EMOTION_COLORS[currentEmotion.emotion] || EMOTION_COLORS.unknown
                } text-white px-2 py-1 rounded-full text-sm flex items-center gap-1 shadow-lg`}
              >
                <span>{EMOTION_EMOJIS[currentEmotion.emotion] || "❓"}</span>
                <span className="capitalize">{currentEmotion.emotion}</span>
                <span className="text-xs opacity-80">
                  {Math.round(currentEmotion.confidence * 100)}%
                </span>
              </div>
            )}
            {/* Analyzing indicator */}
            {isAnalyzing && (
              <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Analyzing...
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4">
            {hasPermission === false ? (
              <>
                <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
                <p className="text-sm text-center">Camera access denied</p>
              </>
            ) : (
              <>
                <CameraOff className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">Camera off</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex justify-center">
        <Button
          variant={isVideoEnabled ? "destructive" : "outline"}
          size="sm"
          onClick={toggleCamera}
          className="gap-2"
        >
          {isVideoEnabled ? (
            <>
              <CameraOff className="h-4 w-4" />
              Disable Camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Enable Camera
            </>
          )}
        </Button>
      </div>

      {/* Privacy notice */}
      <p className="text-xs text-muted-foreground text-center">
        Video is analyzed locally. Only emotion data is saved.
      </p>
    </div>
  );
}
