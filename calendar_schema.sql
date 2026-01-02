-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    color TEXT DEFAULT '#3b82f6', -- Default blue
    guest_count INT DEFAULT 10,
    google_calendar_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_meals table
CREATE TABLE event_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    target_servings INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping_list_items table
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL, -- specific ingredient
    manual_item_name TEXT, -- or raw text if custom
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT,
    is_purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Public Access Policies (Dev Mode)
CREATE POLICY "Enable read access for all users" ON events FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON events FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON events FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON event_meals FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON event_meals FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON event_meals FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON event_meals FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON shopping_list_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON shopping_list_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON shopping_list_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON shopping_list_items FOR DELETE USING (true);
