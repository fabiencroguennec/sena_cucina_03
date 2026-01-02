-- Drop the CHECK constraint on meal_type to allow flexible naming
ALTER TABLE event_meals DROP CONSTRAINT IF EXISTS event_meals_meal_type_check;

-- Add position column for ordering meals within a day
ALTER TABLE event_meals ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;

-- Optional: Update existing meals to have a default position based on their type?
-- For now, let's just default to 0. 
-- If we wanted to be fancy:
-- UPDATE event_meals SET position = 0 WHERE meal_type = 'breakfast';
-- UPDATE event_meals SET position = 1 WHERE meal_type = 'lunch';
-- UPDATE event_meals SET position = 2 WHERE meal_type = 'dinner';
