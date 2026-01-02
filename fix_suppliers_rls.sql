-- Enable Public Access for Suppliers (Dev Mode)

-- 1. Drop existing restricted policies
DROP POLICY IF EXISTS "Access for auth users" ON suppliers;
DROP POLICY IF EXISTS "Access for auth users" ON ingredient_suppliers;

DROP POLICY IF EXISTS "Public Access" ON suppliers;
DROP POLICY IF EXISTS "Public Access" ON ingredient_suppliers;

-- 2. Create Public Policies (True)
CREATE POLICY "Public Access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON ingredient_suppliers FOR ALL USING (true) WITH CHECK (true);

-- Reload config
NOTIFY pgrst, 'reload config';
