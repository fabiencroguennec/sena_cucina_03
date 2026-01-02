
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- DATA DEFINITIONS ---

const ALLERGENS = [
    "Gluten", "Arachides", "Lait", "Oeufs", "Poisson",
    "Crustacés", "Mollusques", "Soja", "Fruits à coque",
    "Céleri", "Moutarde", "Sésame", "Sulfites", "Lupin"
];

const DIETS = [
    "Vegan", "Végétarien", "Sans Gluten", "Sans Porc", "Keto", "Paleo"
];

// Categorized Ingredients (Mediterranean, French, Italian focus)
const INGREDIENTS_DATA = [
    // --- FRUITS & LEGUMES ---
    { name: "Tomate San Marzano", category: "fruit_legume", unit: "kg", price: 3.50, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1524593166156-311f36f2bfa9?q=80&w=300" },
    { name: "Courgette Nice", category: "fruit_legume", unit: "kg", price: 2.20, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1590400192582-7711d95304b4?q=80&w=300" },
    { name: "Aubergine Violette", category: "fruit_legume", unit: "kg", price: 2.80, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1615485925763-867862f80a90?q=80&w=300" },
    { name: "Poivron Rouge", category: "fruit_legume", unit: "kg", price: 3.20, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1563565375-f3fdf5d2e374?q=80&w=300" },
    { name: "Basilic Genovese", category: "fruit_legume", unit: "bot", price: 1.50, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1626083896593-ad56113b2c01?q=80&w=300" },
    { name: "Ail Violet", category: "fruit_legume", unit: "kg", price: 8.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=300" },
    { name: "Oignon Jaune", category: "fruit_legume", unit: "kg", price: 1.20, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1620574348351-597371bea705?q=80&w=300" },
    { name: "Carotte Sable", category: "fruit_legume", unit: "kg", price: 1.50, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?q=80&w=300" },
    { name: "Pomme de Terre Ratte", category: "fruit_legume", unit: "kg", price: 2.50, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1576402484605-01eb2a0db8eb?q=80&w=300" },
    { name: "Citron Jaune Bio", category: "fruit_legume", unit: "kg", price: 3.80, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1587884081480-a65c9288e734?q=80&w=300" },
    { name: "Roquette Sauvage", category: "fruit_legume", unit: "kg", price: 12.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1616766467364-18c6cd771708?q=80&w=300" },
    { name: "Champignon de Paris", category: "fruit_legume", unit: "kg", price: 4.50, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1534441586997-8c3ba0158d60?q=80&w=300" },
    { name: "Fenouil", category: "fruit_legume", unit: "kg", price: 2.90, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1596386461350-326ea7593241?q=80&w=300" },

    // --- VIANDES & POISSONS ---
    { name: "Jambon de Parme (24 mois)", category: "viande_poisson", unit: "kg", price: 35.00, allergens: [], incompatible: ["Vegan", "Végétarien", "Sans Porc"], image: "https://images.unsplash.com/photo-1601356616077-695728ae17ec?q=80&w=300" },
    { name: "Pancetta Affumicata", category: "viande_poisson", unit: "kg", price: 22.00, allergens: [], incompatible: ["Vegan", "Végétarien", "Sans Porc"], image: "https://images.unsplash.com/photo-1619895315183-5c026ec13028?q=80&w=300" },
    { name: "Boeuf Haché (Charolais)", category: "viande_poisson", unit: "kg", price: 14.50, allergens: [], incompatible: ["Vegan", "Végétarien"], image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=300" },
    { name: "Poulet Fermier Label Rouge", category: "viande_poisson", unit: "kg", price: 8.90, allergens: [], incompatible: ["Vegan", "Végétarien"], image: "https://images.unsplash.com/photo-1617196034438-61e87d853049?q=80&w=300" },
    { name: "Saumon Frais (Ecosse)", category: "viande_poisson", unit: "kg", price: 22.00, allergens: ["Poisson"], incompatible: ["Vegan", "Végétarien"], image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?q=80&w=300" },
    { name: "Crevettes Roses (Bio)", category: "viande_poisson", unit: "kg", price: 25.00, allergens: ["Crustacés"], incompatible: ["Vegan", "Végétarien"], image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=300" },
    { name: "Anchois à l'huile", category: "epicerie", unit: "box", price: 4.50, allergens: ["Poisson"], incompatible: ["Vegan", "Végétarien"], image: "https://images.unsplash.com/photo-1542385150-c831dd066b1a?q=80&w=300" },

    // --- CREMERIE ---
    { name: "Parmigiano Reggiano AOP", category: "cremerie", unit: "kg", price: 24.00, allergens: ["Lait"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1617470703828-992e59e95080?q=80&w=300" },
    { name: "Mozzarella Di Bufala", category: "cremerie", unit: "pcs", price: 2.50, allergens: ["Lait"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1587333675200-c97b21fe51a3?q=80&w=300" },
    { name: "Gorgonzola Dolce", category: "cremerie", unit: "kg", price: 18.00, allergens: ["Lait"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=300" },
    { name: "Mascarpone", category: "cremerie", unit: "kg", price: 9.00, allergens: ["Lait"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1559561853-08451507cbe7?q=80&w=300" },
    { name: "Crème Liquide 30%", category: "cremerie", unit: "l", price: 4.20, allergens: ["Lait"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=300" },
    { name: "Beurre Doux AOP", category: "cremerie", unit: "kg", price: 9.50, allergens: ["Lait"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1576777684678-3e36785cb88c?q=80&w=300" },
    { name: "Oeufs Plein Air", category: "cremerie", unit: "pcs", price: 0.35, allergens: ["Oeufs"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1587486913049-53fc88980fa1?q=80&w=300" },
    { name: "Ricotta Fraiche", category: "cremerie", unit: "kg", price: 8.50, allergens: ["Lait"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1568472559091-a67be95b5ba9?q=80&w=300" },

    // --- EPICERIE BASIQUE ---
    { name: "Huile d'Olive Vierge Extra", category: "epicerie", unit: "l", price: 12.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1622283944643-dd9392e62cf2?q=80&w=300" },
    { name: "Pâtes Penne Rigate", category: "epicerie", unit: "kg", price: 2.50, allergens: ["Gluten"], incompatible: ["Sans Gluten"], image: "https://images.unsplash.com/photo-1608355673994-e887556f082e?q=80&w=300" },
    { name: "Pâtes Spaghetti (Bronze)", category: "epicerie", unit: "kg", price: 3.00, allergens: ["Gluten"], incompatible: ["Sans Gluten"], image: "https://images.unsplash.com/photo-1598214886806-c87b84b707bc?q=80&w=300" },
    { name: "Riz Arborio (Risotto)", category: "epicerie", unit: "kg", price: 4.50, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1631557978252-cf8a4879b69b?q=80&w=300" },
    { name: "Farine T55", category: "epicerie", unit: "kg", price: 1.10, allergens: ["Gluten"], incompatible: ["Sans Gluten"], image: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?q=80&w=300" },
    { name: "Sucre En Poudre", category: "epicerie", unit: "kg", price: 1.20, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1612155692224-0021b6d1904a?q=80&w=300" },
    { name: "Vinaigre Balsamique", category: "epicerie", unit: "l", price: 8.00, allergens: ["Sulfites"], incompatible: [], image: "https://images.unsplash.com/photo-1565538356942-8c9a3028c050?q=80&w=300" },
    { name: "Câpres au sel", category: "epicerie", unit: "box", price: 3.50, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1600329035255-0d70ce0f625b?q=80&w=300" },
    { name: "Olives Taggiasche", category: "epicerie", unit: "kg", price: 16.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1591465223363-2287eb193f4e?q=80&w=300" },
    { name: "Poudre d'Amande", category: "epicerie", unit: "kg", price: 14.00, allergens: ["Fruits à coque"], incompatible: [], image: "https://images.unsplash.com/photo-1623428187828-8843279188d5?q=80&w=300" },
    { name: "Noisettes Entières", category: "epicerie", unit: "kg", price: 18.00, allergens: ["Fruits à coque"], incompatible: [], image: "https://images.unsplash.com/photo-1550268576-90f707f18579?q=80&w=300" },
    { name: "Chocolat Noir 70%", category: "epicerie", unit: "kg", price: 15.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1606312619070-d48b7065e1b4?q=80&w=300" },

    // --- EPICES & CONDIMENTS ---
    { name: "Sel Fin de Guérande", category: "epicerie", unit: "kg", price: 0.80, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1626135899981-d1c929221146?q=80&w=300" },
    { name: "Fleur de Sel", category: "epicerie", unit: "kg", price: 18.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1518110925495-5ae866d924d5?q=80&w=300" },
    { name: "Poivre Noir Grains", category: "epicerie", unit: "kg", price: 25.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1596791983057-0ae65261d763?q=80&w=300" },
    { name: "Cumin Moulu", category: "epicerie", unit: "kg", price: 19.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=300" },
    { name: "Paprika Fumé", category: "epicerie", unit: "kg", price: 22.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1632204731698-500742f5344d?q=80&w=300" },
    { name: "Curry Madras", category: "epicerie", unit: "kg", price: 18.00, allergens: ["Moutarde", "Céleri"], incompatible: [], image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=300" },
    { name: "Huile de Tournesol", category: "epicerie", unit: "l", price: 1.80, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1630141675756-17366d7bd492?q=80&w=300" },
    { name: "Vinaigre de Cidre", category: "epicerie", unit: "l", price: 2.50, allergens: ["Sulfites"], incompatible: [], image: "https://images.unsplash.com/photo-1616428448969-98317a7f4749?q=80&w=300" },
    { name: "Moutarde de Dijon", category: "epicerie", unit: "kg", price: 4.50, allergens: ["Moutarde", "Sulfites"], incompatible: [], image: "https://images.unsplash.com/photo-1533230678225-83e71d37b600?q=80&w=300" },
    { name: "Mayonnaise", category: "epicerie", unit: "kg", price: 5.50, allergens: ["Oeufs", "Moutarde"], incompatible: ["Vegan"], image: "https://images.unsplash.com/photo-1585325701165-351af916e581?q=80&w=300" },
    { name: "Sauce Soja", category: "epicerie", unit: "l", price: 3.80, allergens: ["Soja", "Gluten"], incompatible: ["Sans Gluten"], image: "https://images.unsplash.com/photo-1596450502901-57c7d42cf38a?q=80&w=300" },
    { name: "Herbes de Provence", category: "epicerie", unit: "kg", price: 30.00, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1620630787312-d81643666d3a?q=80&w=300" },
    { name: "Cornichons", category: "epicerie", unit: "box", price: 4.00, allergens: ["Moutarde", "Sulfites"], incompatible: [], image: "https://images.unsplash.com/photo-1608643809623-1d02c81bc638?q=80&w=300" },
    { name: "Ketchup", category: "epicerie", unit: "kg", price: 3.20, allergens: [], incompatible: [], image: "https://images.unsplash.com/photo-1597479704052-19e4860b76e1?q=80&w=300" }
];

async function seed() {
    console.log("Starting seed process...");

    // 1. Upsert Allergens
    console.log("Upserting Allergens...");
    const allergenMap = new Map<string, string>();
    for (const name of ALLERGENS) {
        let { data: tag, error } = await supabase
            .from('dietary_tags')
            .select('id')
            .eq('name', name)
            .eq('type', 'allergen')
            .single();

        if (!tag) {
            const { data: newTag, error: createError } = await supabase
                .from('dietary_tags')
                .insert({ name, type: 'allergen' })
                .select('id')
                .single();
            if (createError) console.error("Error creating allergen", name, createError);
            tag = newTag;
        }
        if (tag) allergenMap.set(name, tag.id);
    }

    // 2. Upsert Diets
    console.log("Upserting Diets...");
    const dietMap = new Map<string, string>();
    for (const name of DIETS) {
        let { data: tag, error } = await supabase
            .from('dietary_tags')
            .select('id')
            .eq('name', name)
            .eq('type', 'diet')
            .single();

        if (!tag) {
            const { data: newTag, error: createError } = await supabase
                .from('dietary_tags')
                .insert({ name, type: 'diet' })
                .select('id')
                .single();
            if (createError) console.error("Error creating diet", name, createError);
            tag = newTag;
        }
        if (tag) dietMap.set(name, tag.id);
    }

    // 3. Upsert Ingredients
    console.log(`Upserting ${INGREDIENTS_DATA.length} ingredients...`);

    for (const item of INGREDIENTS_DATA) {
        // Map diet names to IDs
        const incompatibleDietIds = item.incompatible
            .map(dName => dietMap.get(dName))
            .filter(id => id !== undefined) as string[];

        // Upsert Ingredient
        // We match by name to avoid duplicates
        let { data: existing, error: fetchErr } = await supabase
            .from('ingredients')
            .select('id')
            .eq('name', item.name)
            .single();

        let ingredientId = existing?.id;

        const payload = {
            name: item.name,
            category: item.category,
            unit: item.unit,
            price_per_unit: item.price,
            image_url: item.image,
            incompatible_diets: incompatibleDietIds
        };

        if (!ingredientId) {
            const { data: created, error: createErr } = await supabase
                .from('ingredients')
                .insert(payload)
                .select('id')
                .single();
            if (createErr) {
                console.error("Error creating ingredient", item.name, createErr);
                continue;
            }
            ingredientId = created.id;
        } else {
            const { error: updateErr } = await supabase
                .from('ingredients')
                .update(payload)
                .eq('id', ingredientId);
            if (updateErr) console.error("Error updating ingredient", item.name, updateErr);
        }

        // 4. Link Allergens
        if (item.allergens.length > 0) {
            // Remove existing tags to be safe (or just ignore conflicts)
            // Simplest is to clear allergens for this ingredient and re-add
            await supabase.from('ingredient_tags').delete().eq('ingredient_id', ingredientId);

            const tagsToInsert = item.allergens
                .map(aName => allergenMap.get(aName))
                .filter(id => id !== undefined)
                .map(tagId => ({
                    ingredient_id: ingredientId,
                    tag_id: tagId
                }));

            if (tagsToInsert.length > 0) {
                const { error: tagErr } = await supabase.from('ingredient_tags').insert(tagsToInsert);
                if (tagErr) console.error("Error linking allergens for", item.name, tagErr);
            }
        }
    }

    console.log("Seeding complete!");
}

seed().catch(console.error);
