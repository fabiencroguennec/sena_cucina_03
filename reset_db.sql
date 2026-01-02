-- ==========================================
-- RESET SCRIPT
-- ==========================================

-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS recipe_tags CASCADE;
DROP TABLE IF EXISTS ingredient_tags CASCADE;
DROP TABLE IF EXISTS dietary_tags CASCADE;
DROP TABLE IF EXISTS recipe_steps CASCADE;
DROP TABLE IF EXISTS recipe_items CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Core Data: Ingredients & Recipes
-- ==========================================

-- 1.1 Ingredients (Mercuriale)
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT, -- 'Legume', 'Viande', 'Epicerie', etc.
    supplier TEXT,
    price_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL, -- 'Kg', 'L', 'Piece', etc.
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Recipes
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    base_servings INTEGER NOT NULL DEFAULT 1,
    total_cost NUMERIC(10, 2) DEFAULT 0, -- Cache du coût total
    target_margin NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Recipe Items (Junction)
CREATE TABLE recipe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(10, 4) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Recipe Steps
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    instruction_text TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Dietary & Allergens
-- ==========================================

-- 2.1 Tags Definition
CREATE TABLE dietary_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'Gluten Free', 'Vegan', 'Peanut', etc.
    type TEXT NOT NULL CHECK (type IN ('allergen', 'diet')), 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Ingredient Tags (e.g., this flour contains gluten)
CREATE TABLE ingredient_tags (
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES dietary_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (ingredient_id, tag_id)
);

-- 2.3 Recipe Tags (e.g., this recipe is Vegan)
-- Note: allergens usually bubble up from ingredients, but diets might be explicit
CREATE TABLE recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES dietary_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);

-- ==========================================
-- 3. Menus & Planning
-- ==========================================

-- 3.1 Menus (Groups entire event or list of meals)
CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, -- e.g. "Semaine Yoga Juillet"
    start_date DATE,
    end_date DATE,
    guest_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'confirmed', 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Menu Items (Specific meal slots)
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL, -- Can be null if it's just a placeholder text
    custom_label TEXT, -- Override name or simple text if no recipe
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'brunch', 'other')),
    day_date DATE, -- Specific date this meal is served
    servings_override INTEGER, -- If different from menu default
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Shopping List
-- ==========================================

-- 4.1 Lists
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    menu_id UUID REFERENCES menus(id) ON DELETE SET NULL, -- Optional link to a menu
    status TEXT DEFAULT 'open', -- 'open', 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 List Items
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    custom_item_name TEXT, -- If not linked to an ingredient DB item
    quantity NUMERIC(10, 4) NOT NULL DEFAULT 0,
    unit TEXT,
    is_checked BOOLEAN DEFAULT FALSE,
    supplier_override TEXT, -- Freeze supplier at list creation time
    price_override NUMERIC(10, 2), -- Freeze price at list creation time
    category TEXT, -- To sort by aisle/section
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. Security (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Simple "Authenticated Users" Policy for everything for now
-- (In a real SaaS, we would filter by 'organization_id' or 'user_id')

CREATE POLICY "Public Access" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON recipe_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON recipe_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON dietary_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON ingredient_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON recipe_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON menus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON shopping_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON shopping_list_items FOR ALL USING (true) WITH CHECK (true);
