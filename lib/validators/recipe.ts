import { z } from "zod";

export const recipeItemSchema = z.object({
    ingredient_id: z.string().uuid("Sélectionnez un ingrédient"),
    quantity_needed: z.coerce.number().min(0, "Quantité requise"),
    unit: z.string().min(1, "Unité requise"),
});

export const recipeStepSchema = z.object({
    step_order: z.number().int(),
    instruction_text: z.string().min(1, "Instruction requise"),
    image_url: z.string().optional().or(z.literal("")),
});

export const recipeSchema = z.object({
    title: z.string().min(1, "Titre requis"),
    description: z.string().optional(),
    image_url: z.string().optional(),
    base_servings: z.coerce.number().int().min(1, "Minimum 1 couvert"),
    base_servings_small: z.coerce.number().int().min(0).optional().default(0),
    target_margin: z.coerce.number().min(0).max(100).default(70),
    items: z.array(recipeItemSchema).optional().default([]),
    steps: z.array(recipeStepSchema).optional().default([]),
    tags: z.array(z.string()).optional().default([]), // Categories
    themes: z.array(z.string()).optional().default([]), // Themes
    allergens: z.array(z.string()).optional().default([]), // Allergens
    diets: z.array(z.string()).optional().default([]), // Diets
    prep_time: z.coerce.number().min(0).optional().default(0),
    cook_time: z.coerce.number().min(0).optional().default(0),
    rating: z.coerce.number().min(0).max(5).optional().default(0),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;
