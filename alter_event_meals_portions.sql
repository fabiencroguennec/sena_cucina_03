-- Add columns for small and large portions
ALTER TABLE event_meals ADD COLUMN IF NOT EXISTS target_servings_small INT DEFAULT 0;
ALTER TABLE event_meals ADD COLUMN IF NOT EXISTS target_servings_large INT DEFAULT 0;

-- Optional: Initialize them from existing target_servings if needed?
-- For now, we leave them as 0 and let the user fill them.
