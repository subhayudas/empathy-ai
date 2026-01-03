-- Add nursing_assessment to the feedback_category enum
ALTER TYPE public.feedback_category ADD VALUE IF NOT EXISTS 'nursing_assessment';

-- Add new columns to feedback_sessions for nursing assessments
ALTER TABLE public.feedback_sessions 
ADD COLUMN IF NOT EXISTS patient_name text,
ADD COLUMN IF NOT EXISTS room_number text,
ADD COLUMN IF NOT EXISTS condition_summary text,
ADD COLUMN IF NOT EXISTS mood_assessment text,
ADD COLUMN IF NOT EXISTS immediate_needs text[],
ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS is_nursing_assessment boolean DEFAULT false;