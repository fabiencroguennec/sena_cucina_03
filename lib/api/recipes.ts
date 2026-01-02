import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { RecipeFormValues } from "@/lib/validators/recipe";

export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeItem = Database['public']['Tables']['recipe_items']['Row'];
export type RecipeStep = Database['public']['Tables']['recipe_steps']['Row'];
export type DietaryTag = Database['public']['Tables']['dietary_tags']['Row'];

export type FullRecipe = Recipe & {
    recipe_items: (RecipeItem & { ingredients: Database['public']['Tables']['ingredients']['Row'] | null })[];
    recipe_steps: RecipeStep[];
    recipe_tags: { tag_id: string, dietary_tags: { id: string, name: string, type: 'allergen' | 'diet' | 'category' | 'theme' } | null }[];
    prep_time?: number | null;
    cook_time?: number | null;
    rating?: number | null;
    base_servings_small?: number | null;
};

export async function getRecipes() {
    // Simple fetch for lists
    const { data, error } = await supabase
        .from('recipes')
        .select(`
            *,
            recipe_tags (
                tag_id,
                dietary_tags (
                    id,
                    name,
                    type
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getRecipeById(id: string): Promise<FullRecipe | null> {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
      *,
      recipe_items (
        *,
        ingredients (*)
      ),
      recipe_steps (*),
      recipe_tags (
        tag_id,
        dietary_tags (
            id,
            name,
            type
        )
      )
    `)
        .eq('id', id)
        .single();


    if (error) throw error;
    // @ts-ignore: complex join typing
    return data;
}

// ... (previous code)

// ... (imports)

// Fetch Tags
export async function getTags(type?: string) {
    let query = supabase.from('dietary_tags').select('*').order('name');
    if (type) {
        query = query.eq('type', type);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// Create Tag
export async function createTag(name: string, type: 'category' | 'allergen' | 'diet' | 'theme') {
    // First check if it exists to avoid unique constraint error
    const { data: existing } = await supabase
        .from('dietary_tags')
        .select('*')
        .ilike('name', name)
        .single();

    if (existing) {
        // If it exists but has different type, we have a conflict since name is unique.
        // For now, return it anyway, or throw specific error?
        // Let's return it, assuming the user might want to reuse it even if type mismatches (or we handle type in UI)
        return existing;
    }

    const { data, error } = await (supabase
        .from('dietary_tags') as any)
        .insert({ name, type })
        .select()
        .single();

    if (error) {
        console.error("Error creating tag:", error);
        throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
}

// Delete Tag
export async function deleteTag(id: string, force: boolean = false) {
    if (!force) {
        // 1. Check usage in recipes
        const { count, error: countError } = await supabase
            .from('recipe_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', id);

        if (countError) throw countError;

        if (count !== null && count > 0) {
            throw new Error(`Ce tag est utilisé par ${count} recettes. Voulez-vous le supprimer définitivement ?`);
        }
    }

    // 2. Delete
    const { error } = await supabase
        .from('dietary_tags')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function createRecipeWithDetails(data: RecipeFormValues, totalCost: number) {
    // 1. Create Recipe
    // 1. Create Recipe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipeInsert: any = {
        title: data.title,
        description: data.description || null,
        base_servings: data.base_servings,
        base_servings_small: data.base_servings_small,
        target_margin: data.target_margin,
        total_cost: totalCost,
        image_url: data.image_url || null,
        prep_time: data.prep_time,
        cook_time: data.cook_time,
        rating: data.rating,
    };

    const { data: recipe, error: recipeError } = await (supabase
        .from('recipes') as any)
        .insert(recipeInsert)
        .select()
        .single();

    if (recipeError) throw recipeError;

    // 2. Create Items
    const items: Database['public']['Tables']['recipe_items']['Insert'][] = data.items.map(item => ({
        recipe_id: recipe.id,
        ingredient_id: item.ingredient_id,
        quantity_needed: item.quantity_needed,
        unit: item.unit,
    }));

    const { error: itemsError } = await (supabase
        .from('recipe_items') as any)
        .insert(items);

    if (itemsError) throw itemsError;

    // 3. Create Steps
    const steps: Database['public']['Tables']['recipe_steps']['Insert'][] = data.steps.map((step, index) => ({
        recipe_id: recipe.id,
        step_order: index + 1,
        instruction_text: step.instruction_text,
        image_url: step.image_url || null,
    }));

    const { error: stepsError } = await (supabase
        .from('recipe_steps') as any)
        .insert(steps);

    if (stepsError) throw stepsError;

    // 4. Create Tags & Themes & Allergens & Diets
    const allTags = [
        ...(data.tags || []),
        ...(data.themes || []),
        ...(data.allergens || []),
        ...(data.diets || [])
    ];
    if (allTags.length > 0) {
        const tagsToInsert = allTags.map(tagId => ({
            recipe_id: recipe.id,
            tag_id: tagId
        }));

        const { error: tagsError } = await (supabase
            .from('recipe_tags') as any)
            .insert(tagsToInsert);

        if (tagsError) throw tagsError;
    }

    return recipe;
}

export async function updateRecipe(id: string, data: RecipeFormValues, totalCost: number) {
    // 1. Update Recipe Details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipeUpdate: any = {
        title: data.title,
        description: data.description || null,
        base_servings: data.base_servings,
        base_servings_small: data.base_servings_small,
        target_margin: data.target_margin,
        total_cost: totalCost,
        image_url: data.image_url || null,
        updated_at: new Date().toISOString(),
        prep_time: data.prep_time,
        cook_time: data.cook_time,
        rating: data.rating,
    };

    const { error: recipeError } = await (supabase
        .from('recipes') as any)
        .update(recipeUpdate)
        .eq('id', id);

    if (recipeError) throw recipeError;

    // 2. Sync Items (Delete all & Re-insert strategy)
    const { error: deleteItemsError } = await (supabase
        .from('recipe_items') as any)
        .delete()
        .eq('recipe_id', id);

    if (deleteItemsError) throw deleteItemsError;

    const items: Database['public']['Tables']['recipe_items']['Insert'][] = data.items.map(item => ({
        recipe_id: id,
        ingredient_id: item.ingredient_id,
        quantity_needed: item.quantity_needed,
        unit: item.unit,
    }));

    if (items.length > 0) {
        const { error: itemsError } = await (supabase
            .from('recipe_items') as any)
            .insert(items);
        if (itemsError) throw itemsError;
    }

    // 3. Sync Steps (Delete all & Re-insert)
    const { error: deleteStepsError } = await (supabase
        .from('recipe_steps') as any)
        .delete()
        .eq('recipe_id', id);

    if (deleteStepsError) throw deleteStepsError;

    const steps: Database['public']['Tables']['recipe_steps']['Insert'][] = data.steps.map((step, index) => ({
        recipe_id: id,
        step_order: index + 1,
        instruction_text: step.instruction_text,
        image_url: step.image_url || null,
    }));

    if (steps.length > 0) {
        const { error: stepsError } = await (supabase
            .from('recipe_steps') as any)
            .insert(steps);
        if (stepsError) throw stepsError;
    }

    // 4. Sync Tags (Categories & Themes)
    const { error: deleteTagsError } = await (supabase
        .from('recipe_tags') as any)
        .delete()
        .eq('recipe_id', id);

    if (deleteTagsError) throw deleteTagsError;

    const allTags = Array.from(new Set([
        ...(data.tags || []),
        ...(data.themes || []),
        ...(data.allergens || []),
        ...(data.diets || [])
    ]));
    if (allTags.length > 0) {
        const tagsToInsert = allTags.map(tagId => ({
            recipe_id: id,
            tag_id: tagId
        }));

        const { error: tagsError } = await (supabase
            .from('recipe_tags') as any)
            .insert(tagsToInsert);

        if (tagsError) throw tagsError;
    }
}

export async function deleteRecipe(id: string) {
    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
