-- ==========================================
-- FIX RLS SCRIPT (Public Access)
-- ==========================================

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Access for auth users" ON ingredients;
DROP POLICY IF EXISTS "Access for auth users" ON recipes;
DROP POLICY IF EXISTS "Access for auth users" ON recipe_items;
DROP POLICY IF EXISTS "Access for auth users" ON recipe_steps;
DROP POLICY IF EXISTS "Access for auth users" ON dietary_tags;
DROP POLICY IF EXISTS "Access for auth users" ON ingredient_tags;
DROP POLICY IF EXISTS "Access for auth users" ON recipe_tags;
DROP POLICY IF EXISTS "Access for auth users" ON menus;
DROP POLICY IF EXISTS "Access for auth users" ON menu_items;
DROP POLICY IF EXISTS "Access for auth users" ON shopping_lists;
DROP POLICY IF EXISTS "Access for auth users" ON shopping_list_items;
DROP POLICY IF EXISTS "Access for auth users" ON suppliers;
DROP POLICY IF EXISTS "Access for auth users" ON ingredient_suppliers;

DROP POLICY IF EXISTS "Public Access" ON ingredients;
DROP POLICY IF EXISTS "Public Access" ON recipes;
DROP POLICY IF EXISTS "Public Access" ON recipe_items;
DROP POLICY IF EXISTS "Public Access" ON recipe_steps;
DROP POLICY IF EXISTS "Public Access" ON dietary_tags;
DROP POLICY IF EXISTS "Public Access" ON ingredient_tags;
DROP POLICY IF EXISTS "Public Access" ON recipe_tags;
DROP POLICY IF EXISTS "Public Access" ON menus;
DROP POLICY IF EXISTS "Public Access" ON menu_items;
DROP POLICY IF EXISTS "Public Access" ON shopping_lists;
DROP POLICY IF EXISTS "Public Access" ON shopping_list_items;
DROP POLICY IF EXISTS "Public Access" ON suppliers;
DROP POLICY IF EXISTS "Public Access" ON ingredient_suppliers;

-- 2. Create Public Policies (True)
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
CREATE POLICY "Public Access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON ingredient_suppliers FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload config';
