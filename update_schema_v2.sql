-- update_schema_v2.sql

-- 1. Add Time columns to recipes (in minutes)
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cook_time INTEGER DEFAULT 0;

-- 2. Update dietary_tags constraint to include 'theme'
-- We first drop the old constraint (note: the name might vary if it was auto-named, 
-- but in our previous script we named it 'dietary_tags_type_check')
ALTER TABLE dietary_tags DROP CONSTRAINT IF EXISTS dietary_tags_type_check;

ALTER TABLE dietary_tags 
ADD CONSTRAINT dietary_tags_type_check 
CHECK (type IN ('allergen', 'diet', 'category', 'theme'));

-- 3. Insert default Themes
INSERT INTO dietary_tags (name, type) VALUES
('30 minutes ou moins', 'theme'),
('Recevoir', 'theme'),
('Semaine', 'theme'),
('Budget', 'theme'),
('Santé', 'theme'),
('Confort', 'theme'),
('Batch Cooking', 'theme')
ON CONFLICT (name) DO NOTHING;
