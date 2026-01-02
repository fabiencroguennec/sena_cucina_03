
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateSuppliers() {
    console.log("Starting Supplier Migration...");

    // 1. Fetch all ingredients with a supplier
    const { data: ingredients, error: ingError } = await supabase
        .from('ingredients')
        .select('id, name, supplier, price_per_unit, unit')
        .not('supplier', 'is', null)
        .neq('supplier', '');

    if (ingError) {
        console.error("Error fetching ingredients:", ingError);
        return;
    }

    console.log(`Found ${ingredients.length} ingredients with suppliers.`);

    const supplierMap = new Map<string, string>(); // Name -> ID

    for (const ing of ingredients) {
        if (!ing.supplier) continue;

        const supplierName = ing.supplier.trim();
        let supplierId = supplierMap.get(supplierName);

        // 2. Create Supplier if not exists in our map
        if (!supplierId) {
            // Check DB first to avoid duplicates if re-running
            const { data: existing } = await supabase
                .from('suppliers')
                .select('id')
                .eq('name', supplierName)
                .single();

            if (existing) {
                supplierId = existing.id;
            } else {
                const { data: newSupplier, error: createError } = await supabase
                    .from('suppliers')
                    .insert({ name: supplierName })
                    .select('id')
                    .single();

                if (createError) {
                    console.error(`Error creating supplier '${supplierName}':`, createError);
                    continue;
                }
                supplierId = newSupplier.id;
                console.log(`Created new supplier: ${supplierName}`);
            }
            supplierMap.set(supplierName, supplierId!);
        }

        // 3. Link Ingredient to Supplier
        // Check if link exists
        const { data: existingLink } = await supabase
            .from('ingredient_suppliers')
            .select('id')
            .eq('ingredient_id', ing.id)
            .eq('supplier_id', supplierId!)
            .single();

        if (!existingLink) {
            const { error: linkError } = await supabase
                .from('ingredient_suppliers')
                .insert({
                    ingredient_id: ing.id,
                    supplier_id: supplierId!,
                    price: ing.price_per_unit || 0,
                    is_preferred: true, // Default to true since it was their only supplier
                    unit_size: 1, // Default assumption
                    unit_type: ing.unit
                });

            if (linkError) {
                console.error(`Error linking ${ing.name} to ${supplierName}:`, linkError);
            } else {
                console.log(`Linked ${ing.name} -> ${supplierName} (${ing.price_per_unit}€)`);
            }
        }
    }

    console.log("Migration complete!");
}

migrateSuppliers();
