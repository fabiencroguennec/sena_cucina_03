
-- 1. Insert distinct suppliers found in ingredients
INSERT INTO suppliers (name)
SELECT DISTINCT TRIM(supplier)
FROM ingredients
WHERE supplier IS NOT NULL AND TRIM(supplier) <> ''
ON CONFLICT (name) DO NOTHING;

-- 2. Link ingredients to these suppliers
INSERT INTO ingredient_suppliers (ingredient_id, supplier_id, price, unit_type, is_preferred)
SELECT 
    i.id,
    s.id,
    i.price_per_unit,
    i.unit,
    TRUE
FROM ingredients i
JOIN suppliers s ON s.name = TRIM(i.supplier)
WHERE i.supplier IS NOT NULL AND TRIM(i.supplier) <> ''
ON CONFLICT (ingredient_id, supplier_id) DO NOTHING;
