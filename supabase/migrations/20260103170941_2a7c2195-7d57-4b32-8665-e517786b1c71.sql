-- Add emotion tracking columns to feedback_sessions
ALTER TABLE public.feedback_sessions 
ADD COLUMN IF NOT EXISTS emotion_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dominant_emotion text,
ADD COLUMN IF NOT EXISTS emotion_confidence numeric;