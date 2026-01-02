-- Create event_meal_ingredients table to allow adding direct ingredients to meals
CREATE TABLE event_meal_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_meal_id UUID NOT NULL REFERENCES event_meals(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 4) NOT NULL DEFAULT 0,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE event_meal_ingredients ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (Open for verified users as per current dev setup)
CREATE POLICY "Enable read access for all users" ON event_meal_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON event_meal_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON event_meal_ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON event_meal_ingredients FOR DELETE USING (true);
