-- Add column for small portions yield
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS base_servings_small INT DEFAULT 0;

-- Optional: Initialize it strictly greater than base_servings if we wanted to enforce logic immediately, 
-- but for now we leave it 0 or null and let the app handle default filling.
-- A good default might be base_servings * 1 (conservative) or just left as is.
