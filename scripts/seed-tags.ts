import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Env Variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLERGENS = [
    "Gluten", "Crustacés", "Œufs", "Poissons", "Arachides", "Soja",
    "Lait", "Fruits à coque", "Céleri", "Moutarde", "Sésame",
    "Sulfites", "Lupin", "Mollusques"
];

const DIETS = [
    "Végétarien", "Vegan", "Sans Gluten", "Sans Lactose", "Halal", "Casher", "Pescétarienne"
];

async function seed() {
    console.log("🌱 Seeding Tags...");

    for (const name of ALLERGENS) {
        const { error } = await supabase
            .from('dietary_tags')
            .insert({ name, type: 'allergen' })
            .select() // Returning nothing, just checking error
            .maybeSingle(); // Avoid error if duplicates (we'll ignore)

        if (error) {
            if (error.code === '23505') { // Unique violation
                console.log(`⚠️  Allergen exists: ${name}`);
            } else {
                console.error(`❌ Failed to add ${name}:`, error.message);
            }
        } else {
            console.log(`✅ Added Allergen: ${name}`);
        }
    }

    for (const name of DIETS) {
        const { error } = await supabase
            .from('dietary_tags')
            .insert({ name, type: 'diet' })
            .select()
            .maybeSingle();

        if (error) {
            if (error.code === '23505') {
                console.log(`⚠️  Diet exists: ${name}`);
            } else {
                console.error(`❌ Failed to add ${name}:`, error.message);
            }
        } else {
            console.log(`✅ Added Diet: ${name}`);
        }
    }
    console.log("Done.");
}

seed();
