
-- Add category and subcategory columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS subcategory text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_subcategory ON public.jobs(subcategory);

-- Optional: If you want to enforce that category/subcategory are not empty for new jobs, 
-- you might want to add constraints, but for now we'll leave them nullable to support legacy data.
