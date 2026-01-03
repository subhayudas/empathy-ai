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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ref callback to attach stream when video element mounts
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && streamRef.current) {
      console.log("Video element mounted, attaching stream");
      node.srcObject = streamRef.current;
      node.onloadedmetadata = () => {
        console.log("Video metadata loaded");
        node.play().then(() => {
          console.log("Video playing");
          setIsVideoReady(true);
        }).catch(err => console.error("Video play error:", err));
      };
    }
    // Also set the regular ref for frame capture
    (videoRef as any).current = node;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      console.log("Starting camera...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      console.log("Got media stream:", stream);
      streamRef.current = stream;
      setHasPermission(true);
      setIsVideoEnabled(true); // This triggers re-render with video element
    } catch (error) {
      console.error("Camera access denied:", error);
      setHasPermission(false);
      setIsVideoEnabled(false);
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
    setIsVideoReady(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.log("Video or canvas ref not available");
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0) {
      console.log("Context not available or video not ready:", { ctx: !!ctx, videoWidth: video.videoWidth });
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    console.log("Frame captured, size:", dataUrl.length);
    return dataUrl;
  }, []);

  const analyzeEmotion = useCallback(async () => {
    if (!isVideoEnabled || !isVideoReady || isAnalyzing) {
      console.log("Skipping analysis:", { isVideoEnabled, isVideoReady, isAnalyzing });
      return;
    }

    const frame = captureFrame();
    if (!frame) {
      console.log("No frame captured");
      return;
    }

    setIsAnalyzing(true);
    console.log("Sending frame for emotion analysis...");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-emotion", {
        body: { image: frame },
      });

      console.log("Emotion analysis response:", { data, error });

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
  }, [isVideoEnabled, isVideoReady, isAnalyzing, captureFrame, onEmotionDetected]);

  // Auto-start camera when isActive becomes true (voice starts)
  // But don't auto-stop - let user control that
  useEffect(() => {
    if (isActive && !isVideoEnabled && hasPermission !== false) {
      console.log("Auto-starting camera because voice is active");
      startCamera();
    }
  }, [isActive, isVideoEnabled, hasPermission, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Set up analysis interval - only analyze when video is ready
  useEffect(() => {
    if (isVideoEnabled && isVideoReady) {
      console.log("Starting emotion analysis interval");
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
  }, [isVideoEnabled, isVideoReady, analyzeEmotion, analysisInterval]);

  const toggleCamera = () => {
    if (isVideoEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Emotion Analysis</h3>
        <Button
          variant={isVideoEnabled ? "destructive" : "outline"}
          size="sm"
          onClick={toggleCamera}
          className="gap-2"
        >
          {isVideoEnabled ? (
            <>
              <CameraOff className="h-4 w-4" />
              Stop
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Enable Camera
            </>
          )}
        </Button>
      </div>

      {/* Video Preview */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full">
        {isVideoEnabled || streamRef.current ? (
          <>
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
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
            {/* Video ready indicator */}
            {isVideoEnabled && !isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-sm">Loading camera...</div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 min-h-[180px]">
            {hasPermission === false ? (
              <>
                <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
                <p className="text-sm text-center text-white">Camera access denied</p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Please allow camera access in your browser
                </p>
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-center text-muted-foreground">
                  Click "Enable Camera" to start
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Privacy notice */}
      <p className="text-xs text-muted-foreground text-center">
        Video is processed for emotion detection. Only emotion data is saved.
      </p>
    </div>
  );
}
