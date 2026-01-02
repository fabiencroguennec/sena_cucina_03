import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

export type Ingredient = Database['public']['Tables']['ingredients']['Row'] & {
    ingredient_tags?: {
        tag_id: string;
        dietary_tags?: {
            id: string;
            name: string;
            type: 'allergen' | 'diet' | 'category' | 'theme';
        } | null;
    }[];
    ingredient_suppliers?: {
        supplier_id: string;
        supplier: { id: string; name: string } | null;
        price: number;
        supplier_product_code: string | null;
        unit_size: number | null;
        unit_type: string | null;
        is_preferred: boolean | null;
    }[];
    incompatible_diets?: string[] | null;
    images?: string[] | null;
};
export type IngredientInsert = Database['public']['Tables']['ingredients']['Insert'] & {
    allergens?: string[]; // Array of tag IDs
    incompatible_diets?: string[];
};
export type IngredientUpdate = Database['public']['Tables']['ingredients']['Update'] & {
    allergens?: string[]; // Array of tag IDs
    incompatible_diets?: string[];
};

export async function getIngredients() {
    const { data, error } = await supabase
        .from('ingredients')
        .select(`
            *,
            images,
            incompatible_diets,
            ingredient_tags (
                tag_id,
                dietary_tags (
                    id,
                    name,
                    type
                )
            ),
            ingredient_suppliers (
                supplier_id,
                supplier:suppliers (
                    id,
                    name
                ),
                price,
                supplier_product_code,
                unit_size,
                unit_type,
                is_preferred
            )
        `)
        .order('name', { ascending: true });

    if (error) throw error;
    // @ts-ignore
    return data as Ingredient[];
}

export async function getIngredientById(id: string) {
    const { data, error } = await supabase
        .from('ingredients')
        .select(`
            *,
            images,
            incompatible_diets,
            ingredient_tags (
                tag_id,
                dietary_tags (
                    id,
                    name,
                    type
                )
            ),
            ingredient_suppliers (
                supplier_id,
                supplier:suppliers (
                    id,
                    name
                ),
                price,
                supplier_product_code,
                unit_size,
                unit_type,
                is_preferred
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message || "Unknown error fetching ingredient");
    // @ts-ignore
    return data as Ingredient;
}

// ... imports ...

export async function createIngredient(ingredient: IngredientInsert & { suppliers?: any[] }) {
    // Extract allergens and suppliers from the insert object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allergens, suppliers, ...ingData } = ingredient;
    console.log("createIngredient payload:", ingredient);

    const { data, error } = await supabase
        .from('ingredients')
        // @ts-ignore
        .insert(ingData)
        .select()
        .single();

    if (error) {
        console.error("Supabase API Error (createIngredient):", error, "Details:", error.details, "Message:", error.message);
        throw error;
    }

    // @ts-ignore
    const ingredientId = data.id;

    // Insert tags if present
    if (allergens && allergens.length > 0) {
        const tagInserts = allergens.map(tagId => ({
            ingredient_id: ingredientId,
            tag_id: tagId
        }));
        // @ts-ignore
        await supabase.from('ingredient_tags').insert(tagInserts);
    }

    // Insert suppliers if present
    if (suppliers && suppliers.length > 0) {
        const supplierInserts = suppliers.map(s => ({
            ingredient_id: ingredientId,
            supplier_id: s.supplier_id,
            price: s.price,
            supplier_product_code: s.supplier_product_code,
            unit_size: s.unit_size,
            unit_type: s.unit_type,
            is_preferred: s.is_preferred
        }));
        // @ts-ignore
        const { error: supError } = await supabase.from('ingredient_suppliers').insert(supplierInserts);
        if (supError) console.error("Error inserting ingredient suppliers:", supError);
    }

    // @ts-ignore
    return data as Ingredient;
}

export async function updateIngredient(id: string, updates: IngredientUpdate & { suppliers?: any[] }) {
    // Extract allergens and suppliers from the update object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allergens, suppliers, ...ingData } = updates;
    console.log("updateIngredient payload:", updates);

    const { data, error } = await supabase
        .from('ingredients')
        // @ts-ignore
        .update(ingData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // Update tags if provided
    if (allergens !== undefined) {
        await supabase.from('ingredient_tags').delete().eq('ingredient_id', id);
        if (allergens.length > 0) {
            const tagInserts = allergens.map(tagId => ({
                ingredient_id: id,
                tag_id: tagId
            }));
            // @ts-ignore
            await supabase.from('ingredient_tags').insert(tagInserts);
        }
    }

    // Update suppliers if provided
    if (suppliers !== undefined) {
        await supabase.from('ingredient_suppliers').delete().eq('ingredient_id', id);
        if (suppliers.length > 0) {
            const supplierInserts = suppliers.map(s => ({
                ingredient_id: id,
                supplier_id: s.supplier_id,
                price: s.price,
                supplier_product_code: s.supplier_product_code,
                unit_size: s.unit_size,
                unit_type: s.unit_type,
                is_preferred: s.is_preferred
            }));
            // @ts-ignore
            const { error: supError } = await supabase.from('ingredient_suppliers').insert(supplierInserts);
            if (supError) console.error("Error updating ingredient suppliers:", supError);
        }
    }

    return data;
}


export async function deleteIngredient(id: string) {
    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ... existing code

export async function getIngredientPriceHistory(ingredientId: string) {
    const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
            *,
            events (
                id,
                title,
                start_date
            ),
            suppliers (
                id,
                name
            )
        `)
        .eq('ingredient_id', ingredientId)
        .eq('is_purchased', true)
        .not('price_paid', 'is', null)
        .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getIngredientsLastPurchases(ingredientIds: string[]) {
    if (!ingredientIds || ingredientIds.length === 0) return {};

    const { data, error } = await supabase
        .from('shopping_list_items')
        .select('ingredient_id, supplier_id, price_paid, unit_bought, quantity_bought, purchase_date, created_at')
        // @ts-ignore
        .in('ingredient_id', ingredientIds)
        .eq('is_purchased', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching last purchases", error);
        return {};
    }

    // Process to find unique latest per ingredient
    const latestMap: Record<string, any> = {};
    if (data) {
        for (const item of data) {
            if (item.ingredient_id && !latestMap[item.ingredient_id]) {
                latestMap[item.ingredient_id] = item;
            }
        }
    }
    return latestMap;
}
