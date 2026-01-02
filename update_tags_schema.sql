-- update_tags_schema.sql

-- 1. Update the check constraint on dietary_tags to include 'category'
ALTER TABLE dietary_tags DROP CONSTRAINT IF EXISTS dietary_tags_type_check;

ALTER TABLE dietary_tags 
ADD CONSTRAINT dietary_tags_type_check 
CHECK (type IN ('allergen', 'diet', 'category'));

-- 2. Insert some default categories
INSERT INTO dietary_tags (name, type) VALUES
('Entrée', 'category'),
('Plat Principal', 'category'),
('Dessert', 'category'),
('Petit-déjeuner', 'category'),
('Snack', 'category'),
('Boisson', 'category')
ON CONFLICT (name) DO NOTHING;
