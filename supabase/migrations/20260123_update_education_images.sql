-- Add images column to education_resources to support multiple images
ALTER TABLE public.education_resources 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS allows access for images
-- Since it's a new column, existing policies using * will allow it.
-- But let's verify if there are any specific column-level restrictions (rare in this project)

COMMENT ON COLUMN public.education_resources.images IS 'Array of image URLs for the education program';
