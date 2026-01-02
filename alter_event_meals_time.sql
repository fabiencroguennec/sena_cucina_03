-- Add meal_time column to event_meals
ALTER TABLE event_meals ADD COLUMN IF NOT EXISTS meal_time TEXT;
