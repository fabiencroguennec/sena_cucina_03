
-- Add order_in_slot column to event_meals for ordering within a meal group
ALTER TABLE event_meals ADD COLUMN IF NOT EXISTS order_in_slot INT DEFAULT 0;

-- Update existing records to have a default order (using id or random)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, date, position ORDER BY created_at) - 1 as new_order
  FROM event_meals
)
UPDATE event_meals
SET order_in_slot = ranked.new_order
FROM ranked
WHERE event_meals.id = ranked.id;
