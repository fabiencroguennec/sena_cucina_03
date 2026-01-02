
import { useMemo } from "react";
import { Event, EventMeal, ShoppingListItem } from "@/lib/types/calendar";
import { convertQuantity } from "@/lib/conversions";

export type AggregatedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    is_purchased: boolean;
    shopping_list_id?: string;
    // New fields
    supplier_id?: string;
    price_paid?: number;
    base_price_per_unit?: number; // Added to preserve reference
    ingredient_unit?: string; // ORIGINAL unit from DB to reference base_price
    quantity_bought?: number;
    unit_bought?: string;
    price_per_unit_override?: number;
    quality_rating?: number;
    purchase_date?: string;
    allocated_cost?: number; // Real cost proportional to usage
};

interface UseShoppingListCalculationProps {
    meals: EventMeal[];
    // event is optional if we just want to calculate raw ingredients, but needed for guest_count fallback
    event?: Partial<Event>;
    dbItems?: ShoppingListItem[];
    guestCount?: number;
    lastPurchases?: Record<string, any>;
}

export function useShoppingListCalculation({ meals, event, dbItems = [], guestCount = 10, lastPurchases = {} }: UseShoppingListCalculationProps) {

    // Determine effective guest count if not provided
    const defaultGuestCount = event?.guest_count || guestCount;

    const items = useMemo(() => {
        const map = new Map<string, AggregatedItem>();

        // Helper to get defaults
        const getDefaults = (ing: any) => {
            const last = lastPurchases[ing.id];
            if (last) {
                return {
                    supplier_id: last.supplier_id,
                    price_paid: last.price_paid,
                    quantity_bought: last.quantity_bought,
                    unit_bought: last.unit_bought
                };
            }
            // Fallback to standard
            return {
                supplier_id: undefined,
                price_paid: ing.price_per_unit || 0,
                quantity_bought: 1,
                unit_bought: ing.unit || 'kg'
            };
        };

        // 1. Process Meals
        meals.forEach(meal => {
            // Part A: Recipe Items
            // @ts-ignore
            const recipe = meal.recipes;

            if (recipe && recipe.recipe_items) {
                let ratio = 1;
                if (meal.target_servings_small && meal.target_servings_small > 0) {
                    // Small Plate
                    ratio = meal.target_servings_small / (recipe.base_servings_small || Math.ceil((recipe.base_servings || 1) * 1.5) || 1);
                } else if (meal.target_servings_large && meal.target_servings_large > 0) {
                    // Large Plate
                    ratio = meal.target_servings_large / (recipe.base_servings || 1);
                } else {
                    // Fallback
                    // Priority: meal specific target -> event specific guest count (joined) -> hook fallback -> 10
                    const count = meal.target_servings || meal.events?.guest_count || defaultGuestCount;
                    ratio = count / (recipe.base_servings || 1);
                }

                // @ts-ignore
                recipe.recipe_items.forEach((ri: any) => {
                    const ing = ri.ingredients;
                    if (!ing) return;

                    // Priority: Recipe Item Unit > Ingredient Unit > Default
                    const targetUnit = ri.unit || ing.unit || 'kg';
                    const rawQty = (ri.quantity_needed || 0) * ratio;
                    const qty = convertQuantity(rawQty, ri.unit || targetUnit, targetUnit);

                    const existing = map.get(ing.id);

                    if (existing) {
                        existing.quantity += qty;
                    } else {
                        const defaults = getDefaults(ing);
                        map.set(ing.id, {
                            id: ing.id,
                            name: ing.name || "Ingrédient inconnu",
                            quantity: qty,
                            unit: targetUnit,
                            category: ing.category || 'Vrac',
                            is_purchased: false,
                            base_price_per_unit: ing.price_per_unit || 0, // Set base price
                            ingredient_unit: ing.unit,
                            // Apply Defaults
                            ...defaults
                        });
                    }
                });
            }

            // Part B: Direct Ingredients
            if (meal.meal_ingredients) {
                meal.meal_ingredients.forEach((mi: any) => {
                    const ing = mi.ingredients;
                    if (!ing) return;

                    const targetUnit = mi.unit || ing.unit || 'kg';
                    const rawQty = mi.quantity || 0;
                    const qty = convertQuantity(rawQty, mi.unit || targetUnit, targetUnit);

                    const existing = map.get(ing.id);

                    if (existing) {
                        existing.quantity += qty;
                    } else {
                        const defaults = getDefaults(ing);
                        map.set(ing.id, {
                            id: ing.id,
                            name: ing.name || "Ingrédient inconnu",
                            quantity: qty,
                            unit: targetUnit, // Use target unit (ingredient unit)
                            category: ing.category || 'Vrac',
                            is_purchased: false,
                            base_price_per_unit: ing.price_per_unit || 0, // Set base price
                            // Apply Defaults
                            ...defaults
                        });
                    }
                });
            }
        });

        // 2. Process DB Items (Overrides or Manual Additions)
        // ... (rest is same, DB items will overwrite)
        // Note: DB items are usually "global" for the event. 
        // If we are in "Daily Mode" (subset of meals), we might not want to apply ALL DB items (manual ones especially).
        // However, for purchased status, we DEFINITELY want to sync.
        // For now, logic: always apply purchase status. Only apply manual items if they are conceptually "daily" (impossible to know).
        // Strategy: If dbItems provided, apply them. The caller controls which dbItems are passed.

        dbItems.forEach(dbItem => {
            if (dbItem.ingredient_id && map.has(dbItem.ingredient_id)) {
                // Update existing ingredient item
                const item = map.get(dbItem.ingredient_id)!;
                item.is_purchased = dbItem.is_purchased;
                item.shopping_list_id = dbItem.id;
                // Sync new fields
                item.supplier_id = dbItem.supplier_id;
                item.price_paid = dbItem.price_paid;
                item.quantity_bought = dbItem.quantity_bought;
                item.unit_bought = dbItem.unit_bought;
                item.price_per_unit_override = dbItem.price_per_unit_override;
                item.quality_rating = dbItem.quality_rating;
                item.purchase_date = dbItem.purchase_date;
            } else {
                // Create new item (Manual or Ingredient override not in meals)
                // improved name resolution
                let finalName = dbItem.manual_item_name;
                if (!finalName) {
                    const ing = dbItem.ingredients as any;
                    if (ing) {
                        if (ing.name) finalName = ing.name;
                        else if (Array.isArray(ing) && ing.length > 0 && ing[0].name) finalName = ing[0].name;
                    }
                }

                map.set(dbItem.id, {
                    id: dbItem.id,
                    name: finalName || "Article sans nom",
                    quantity: dbItem.quantity,
                    unit: dbItem.unit,
                    category: dbItem.ingredients?.category || 'Divers',
                    is_purchased: dbItem.is_purchased,
                    shopping_list_id: dbItem.id,
                    // Sync new fields
                    supplier_id: dbItem.supplier_id,
                    price_paid: dbItem.price_paid,
                    base_price_per_unit: 0,
                    quantity_bought: dbItem.quantity_bought,
                    unit_bought: dbItem.unit_bought,
                    price_per_unit_override: dbItem.price_per_unit_override,
                    quality_rating: dbItem.quality_rating,
                    purchase_date: dbItem.purchase_date,
                    allocated_cost: (dbItem.price_paid && dbItem.quantity_bought)
                        ? (dbItem.price_paid / dbItem.quantity_bought) * dbItem.quantity
                        : 0
                });
            }
        });

        // 3. Final Pass: Calculate Allocated Cost for all items (Ingredient-based)
        // We do this here to avoid duplicating logic in the loop above
        for (const item of map.values()) {
            if (item.allocated_cost !== undefined) continue; // Already set (Manual items)

            let unitPrice = 0;
            let refUnit = item.unit;

            // Determine Unit Price & Reference Unit
            if (item.price_paid && item.quantity_bought && item.quantity_bought > 0) {
                // Actual Purchase Price
                unitPrice = item.price_paid / item.quantity_bought;
                refUnit = (item.unit_bought || item.unit) as string;
            } else {
                // Estimated Price from DB
                unitPrice = item.base_price_per_unit || 0;
                // If we have the original DB unit, use it as reference for the price
                if (item.ingredient_unit) {
                    refUnit = item.ingredient_unit;
                }
            }

            // Calculate Cost
            // We want cost of `item.quantity` (in `item.unit`).
            // Price is `unitPrice` per `refUnit`.
            // We need to convert `item.quantity` from `item.unit` to `refUnit`.
            const qtyInRefUnit = convertQuantity(item.quantity, item.unit, refUnit);
            item.allocated_cost = unitPrice * qtyInRefUnit;
        }

        return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
    }, [meals, dbItems, defaultGuestCount]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, AggregatedItem[]> = {};
        items.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [items]);

    return { items, groupedItems };
}
