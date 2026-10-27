-- Update existing components to have GPT enabled by default
UPDATE public.components 
SET is_gpt_enabled = true,
    updated_at = NOW()
WHERE is_gpt_enabled = false;