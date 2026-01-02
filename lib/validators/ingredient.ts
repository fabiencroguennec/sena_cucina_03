import { z } from "zod";

export const ingredientSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    category: z.string().optional(),
    supplier: z.string().optional(),
    price_per_unit: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
    unit: z.string().min(1, "L'unité est requise"),
    image_url: z.string().url("URL invalide").optional().or(z.literal("")),
    images: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
    incompatible_diets: z.array(z.string()).optional(),
    suppliers: z.array(z.object({
        supplier_id: z.string().min(1, "Fournisseur requis"),
        price: z.coerce.number().min(0, "Prix requis"),
        supplier_product_code: z.string().optional(),
        unit_size: z.coerce.number().min(0.001, "Taille requise").default(1),
        unit_type: z.string().optional(),
        is_preferred: z.boolean().default(false),
    })).optional(),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

export const UNIT_OPTIONS = [
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "l", label: "l" },
    { value: "cl", label: "cl" },
    { value: "ml", label: "ml" },
    { value: "pcs", label: "pcs" },
    { value: "bot", label: "botte" },
    { value: "box", label: "boîte" },
    { value: "cac", label: "c.à.c" },
    { value: "cas", label: "c.à.s" },
];

export const CATEGORY_OPTIONS = [
    { value: "fruits", label: "Fruits" },
    { value: "legumes", label: "Légumes" },
    { value: "viande", label: "Viande" },
    { value: "poissons", label: "Poissons" },
    { value: "fruits_de_mer", label: "Fruits de mer" },
    { value: "produits_laitiers", label: "Produits Laitiers" },
    { value: "epices_herbes", label: "Epices et herbes" },
    { value: "cereales_legumineuses", label: "Céreales et Légumineuses" },
    { value: "sucre", label: "Sucre" },
    { value: "noix_oleagineux", label: "Noix et Oléogineux" },
    { value: "autres", label: "Autres" },
];
