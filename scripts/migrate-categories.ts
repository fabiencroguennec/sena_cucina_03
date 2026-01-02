
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categorizeByName = (name: string): string => {
    const lower = name.toLowerCase();

    // Specific exclusions/exceptions
    if (lower.includes('pomme de terre') || lower.includes('patate')) return 'legumes';
    if (lower.includes('tomate')) return 'legumes';
    if (lower.includes('avocat')) return 'legumes';
    if (lower.includes('aubergine')) return 'legumes';
    if (lower.includes('courgette')) return 'legumes';
    if (lower.includes('concombre')) return 'legumes';

    // Fruits
    if (['pomme', 'banane', 'orange', 'citron', 'fraise', 'framboise', 'poire', 'pêche', 'abricot', 'kiwi', 'raisin', 'ananas', 'mangue', 'melon', 'pastèque', 'cerise', 'prune', 'figue', 'datte', 'fruit', 'clémentine', 'mandarine', 'pamplemousse', 'grenade', 'myrtille', 'cassis', 'mûre', 'citron vert'].some(k => lower.includes(k))) {
        return 'fruits';
    }

    // Fruits de mer (check before poissons)
    if (['crevette', 'moule', 'huitre', 'crabe', 'homard', 'langoustine', 'saint-jacques', 'encornet', 'calamar', 'poulpe', 'coquille', 'bulot', 'gambas'].some(k => lower.includes(k))) {
        return 'fruits_de_mer';
    }

    // Poissons
    if (['poisson', 'saumon', 'thon', 'cabillaud', 'bar', 'daurade', 'truite', 'sardine', 'maquereau', 'sole', 'merlu', 'lieu', 'haddock', 'anchois'].some(k => lower.includes(k))) {
        return 'poissons';
    }

    // Viande
    if (['viande', 'boeuf', 'veau', 'porc', 'agneau', 'mouton', 'poulet', 'dinde', 'canard', 'lapin', 'saucisse', 'jambon', 'bacon', 'steak', 'charcuterie', 'lard'].some(k => lower.includes(k))) {
        return 'viande';
    }

    // Produits Laitiers
    if (['lait', 'crème', 'beurre', 'yaourt', 'fromage', 'parmesan', 'mozzarella', 'emmental', 'comté', 'chèvre', 'brie', 'camembert', 'oeuf'].some(k => lower.includes(k))) {
        return 'produits_laitiers';
    }

    // Epices et herbes (check before legumes if ambiguous)
    if (['poivre', 'sel', 'épice', 'herbe', 'origan', 'basilic', 'thym', 'persil', 'curry', 'paprika', 'cumin', 'cannelle', 'vanille', 'menthe', 'coriandre', 'ciboulette', 'aneth', 'romarin', 'sauge', 'estragon', 'laurier', 'gingembre', 'safran', 'muscade'].some(k => lower.includes(k))) {
        return 'epices_herbes';
    }

    // Légumes (broad)
    if (['ail', 'oignon', 'carotte', 'chou', 'brocoli', 'navet', 'poireau', 'céleri', 'épinard', 'salade', 'laitue', 'radis', 'asperge', 'haricot vert', 'potiron', 'courge', 'champignon', 'échalote', 'betterave'].some(k => lower.includes(k))) {
        return 'legumes';
    }

    // Céréales et Légumineuses
    if (['farine', 'riz', 'pâte', 'semoule', 'blé', 'lentille', 'pois', 'haricot', 'quinoa', 'boulghour', 'maïs', 'pain', 'levure', 'amidon', 'fécule', 'flocon', 'avoine', 'seigle', 'orge', 'pois chiche'].some(k => lower.includes(k))) {
        return 'cereales_legumineuses';
    }

    // Sucre / Épicerie sucrée
    if (['sucre', 'miel', 'chocolat', 'sirop', 'cacao', 'confiture', 'caramel', 'nuggets', 'bonbon', 'biscuit'].some(k => lower.includes(k))) {
        return 'sucre';
    }

    // Noix et Oléogineux
    if (['noix', 'amande', 'noisette', 'pistache', 'cajou', 'huile', 'olive', 'vinaigre', 'arachide', 'pécan', 'macadamia', 'pignon'].some(k => lower.includes(k))) {
        return 'noix_oleagineux';
    }

    return 'autres';
};

async function migrate() {
    console.log("Starting re-classification...");

    // 1. Fetch all ingredients
    const { data: ingredients, error } = await supabase.from('ingredients').select('id, name, category');

    if (error) {
        console.error("Error fetching ingredients:", error);
        return;
    }

    if (!ingredients || ingredients.length === 0) {
        console.log("No ingredients found.");
        return;
    }

    console.log(`Found ${ingredients.length} ingredients to check.`);

    let updatedCount = 0;

    for (const ing of ingredients) {
        const currentCat = ing.category;

        // Re-classify based on name
        let newCat = categorizeByName(ing.name);

        // If my logic returns 'autres' but the existing category is one of the valid new ones, 
        // I might trust the existing one unless I'm sure it's wrong?
        // But user asked to "modifie...".
        // Let's assume my logic is better, but maybe 'autres' means I failed to guess.
        // If I fail to guess ('autres') and they have a valid specific category, keep it.
        const VALID_CATS = ['fruits', 'legumes', 'viande', 'poissons', 'fruits_de_mer', 'produits_laitiers', 'epices_herbes', 'cereales_legumineuses', 'sucre', 'noix_oleagineux', 'autres'];

        if (newCat === 'autres' && VALID_CATS.includes(currentCat || '') && currentCat !== 'autres') {
            // Keep distinct valid category if I can't guess better
            newCat = currentCat!;
        }

        if (newCat !== currentCat) {
            console.log(`Migrating "${ing.name}": ${currentCat} -> ${newCat}`);
            const { error: updateError } = await supabase
                .from('ingredients')
                .update({ category: newCat })
                .eq('id', ing.id);

            if (updateError) {
                console.error(`Error updating ${ing.name}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Migration complete. Updated ${updatedCount} ingredients.`);
}

migrate();
