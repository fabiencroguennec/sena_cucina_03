-- Migration des catégories d'ingrédients vers la nouvelle nomenclature

-- 1. Fruits & Légumes (fruit_legume) -> Fruits (fruits) ou Légumes (legumes)
UPDATE ingredients
SET category = CASE
    WHEN name ILIKE '%pomme%' OR name ILIKE '%banane%' OR name ILIKE '%orange%' OR name ILIKE '%citron%' 
      OR name ILIKE '%fraise%' OR name ILIKE '%framboise%' OR name ILIKE '%poire%' OR name ILIKE '%pêche%' 
      OR name ILIKE '%abricot%' OR name ILIKE '%kiwi%' OR name ILIKE '%raisin%' OR name ILIKE '%ananas%' 
      OR name ILIKE '%mangue%' OR name ILIKE '%melon%' OR name ILIKE '%pastèque%' OR name ILIKE '%cerise%' 
      OR name ILIKE '%prune%' OR name ILIKE '%figue%' OR name ILIKE '%datte%' OR name ILIKE '%fruit%' THEN 'fruits'
    ELSE 'legumes' -- Par défaut, on met en légumes si ce n'est pas un fruit évident
END
WHERE category = 'fruit_legume';

-- 2. Viandes & Poissons (viande_poisson) -> Fruits de mer, Poissons ou Viande
UPDATE ingredients
SET category = CASE
    WHEN name ILIKE '%crevette%' OR name ILIKE '%moule%' OR name ILIKE '%huitre%' OR name ILIKE '%crabe%' 
      OR name ILIKE '%homard%' OR name ILIKE '%langoustine%' OR name ILIKE '%saint-jacques%' OR name ILIKE '%encornet%' 
      OR name ILIKE '%calamar%' OR name ILIKE '%poulpe%' THEN 'fruits_de_mer'
    WHEN name ILIKE '%poisson%' OR name ILIKE '%saumon%' OR name ILIKE '%thon%' OR name ILIKE '%cabillaud%' 
      OR name ILIKE '%bar%' OR name ILIKE '%daurade%' OR name ILIKE '%truite%' OR name ILIKE '%sardine%' 
      OR name ILIKE '%maquereau%' OR name ILIKE '%sole%' OR name ILIKE '%merlu%' THEN 'poissons'
    ELSE 'viande'
END
WHERE category = 'viande_poisson';

-- 3. Crèmerie (cremerie) -> Produits Laitiers (produits_laitiers)
UPDATE ingredients
SET category = 'produits_laitiers'
WHERE category = 'cremerie';

-- 4. Épicerie (epicerie) -> Sucre, Céréales, Epices, Noix ou Autres
UPDATE ingredients
SET category = CASE
    WHEN name ILIKE '%sucre%' OR name ILIKE '%miel%' OR name ILIKE '%chocolat%' OR name ILIKE '%sirop%' 
      OR name ILIKE '%cacao%' OR name ILIKE '%confiture%' OR name ILIKE '%caramel%' THEN 'sucre'
    WHEN name ILIKE '%farine%' OR name ILIKE '%riz%' OR name ILIKE '%pâte%' OR name ILIKE '%semoule%' 
      OR name ILIKE '%blé%' OR name ILIKE '%lentille%' OR name ILIKE '%pois%' OR name ILIKE '%haricot%' 
      OR name ILIKE '%quinoa%' OR name ILIKE '%boulghour%' OR name ILIKE '%maïs%' OR name ILIKE '%pain%' THEN 'cereales_legumineuses'
    WHEN name ILIKE '%poivre%' OR name ILIKE '%sel%' OR name ILIKE '%épice%' OR name ILIKE '%herbe%' 
      OR name ILIKE '%origan%' OR name ILIKE '%basilic%' OR name ILIKE '%thym%' OR name ILIKE '%persil%' 
      OR name ILIKE '%curry%' OR name ILIKE '%paprika%' OR name ILIKE '%cumin%' OR name ILIKE '%cannelle%' 
      OR name ILIKE '%vanille%' OR name ILIKE '%menthe%' THEN 'epices_herbes'
    WHEN name ILIKE '%noix%' OR name ILIKE '%amande%' OR name ILIKE '%noisette%' OR name ILIKE '%pistache%' 
      OR name ILIKE '%cajou%' OR name ILIKE '%huile%' OR name ILIKE '%olive%' OR name ILIKE '%vinaigre%' THEN 'noix_oleagineux'
    ELSE 'autres'
END
WHERE category = 'epicerie';

-- 5. Autre (autre) -> Autres (autres)
UPDATE ingredients
SET category = 'autres'
WHERE category = 'autre';

-- Vérification (optionnel)
-- SELECT name, category FROM ingredients;
