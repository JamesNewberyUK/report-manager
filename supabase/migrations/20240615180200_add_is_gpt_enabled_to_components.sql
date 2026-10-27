-- Add is_gpt_enabled column to components table
ALTER TABLE public.components 
ADD COLUMN IF NOT EXISTS is_gpt_enabled BOOLEAN NOT NULL DEFAULT true;

-- Update the updated_at timestamp for existing rows
UPDATE public.components 
SET updated_at = NOW() 
WHERE is_gpt_enabled IS NULL;
