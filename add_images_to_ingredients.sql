-- Add images column (JSONB array) to ingredients table
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Backfill existing image_url into images array
UPDATE ingredients
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url != '' AND (images IS NULL OR jsonb_array_length(images) = 0);
