"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getEventById, getEventMeals, getShoppingList, toggleShoppingItem } from "@/lib/api/calendar";
import { supabase } from "@/lib/supabase";
import { Event, EventMeal, ShoppingListItem } from "@/lib/types/calendar";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Share2, Copy, CheckCircle2, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Ingredient } from "@/lib/api/ingredients";

// Flattened item for display
type AggregatedItem = {
    id: string; // ingredient_id or manual_id
    name: string;
    quantity: number;
    unit: string;
    category: string;
    is_purchased: boolean;
    shopping_list_id?: string; // if it exists in DB
};

export default function ShoppingListPage() {
    const params = useParams();
    const id = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [meals, setMeals] = useState<EventMeal[]>([]);
    const [dbItems, setDbItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            Promise.all([
                getEventById(id),
                getEventMeals(id),
                getShoppingList(id)
            ]).then(([eventData, mealsData, listData]) => {
                setEvent(eventData);
                setMeals(mealsData);
                setDbItems(listData);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [id]);

    const items = useMemo(() => {
        const map = new Map<string, AggregatedItem>();

        // 1. Process Meals
        meals.forEach(meal => {
            // @ts-ignore
            const recipe = meal.recipes;
            if (!recipe || !recipe.recipe_items) return;

            const ratio = (meal.target_servings || 10) / (recipe.base_servings || 1);

            // @ts-ignore
            recipe.recipe_items.forEach((ri: any) => {
                const ing = ri.ingredients;
                if (!ing) return;

                const qty = (ri.quantity_needed || 0) * ratio;
                const existing = map.get(ing.id);

                // Use the Recipe Item unit if available, otherwise Ingredient unit
                const unit = ri.unit || ing.unit || "unit";

                if (existing) {
                    existing.quantity += qty;
                } else {
                    map.set(ing.id, {
                        id: ing.id,
                        name: ing.name,
                        quantity: qty,
                        unit: unit,
                        category: ing.category || 'Vrac',
                        is_purchased: false // default
                    });
                }
            });
        });

        // 1b. Process Direct Meal Ingredients (e.g. added manually to the slot)
        meals.forEach(meal => {
            if (!meal.meal_ingredients) return;

            // @ts-ignore
            meal.meal_ingredients.forEach((mi: any) => {
                const ing = mi.ingredients;
                if (!ing) return; // Should not happen if relation is correct

                const qty = mi.quantity || 0;
                const existing = map.get(ing.id);
                // Use the Meal Ingredient unit
                const unit = mi.unit || ing.unit || "unit";

                if (existing) {
                    existing.quantity += qty;
                } else {
                    map.set(ing.id, {
                        id: ing.id,
                        name: ing.name,
                        quantity: qty,
                        unit: unit,
                        category: ing.category || 'Vrac',
                        is_purchased: false
                    });
                }
            });
        });

        // 2. Process DB Items (Sync Status)
        // If an item is in DB, use its status. 
        // Also support Manual items (not implemented in UI yet but schema supports it)
        dbItems.forEach(dbItem => {
            if (dbItem.ingredient_id && map.has(dbItem.ingredient_id)) {
                const item = map.get(dbItem.ingredient_id)!;
                item.is_purchased = dbItem.is_purchased;
                item.shopping_list_id = dbItem.id;
            } else if (dbItem.manual_item_name) {
                // Add manual items
                map.set(dbItem.id, {
                    id: dbItem.id,
                    name: dbItem.manual_item_name,
                    quantity: dbItem.quantity,
                    unit: dbItem.unit,
                    category: 'Divers',
                    is_purchased: dbItem.is_purchased,
                    shopping_list_id: dbItem.id
                });
            } else if (dbItem.ingredient_id) {
                // Ingredient from DB that might not be in current meals (optional: keep or hide?)
                // For now, let's skip orphaned DB items or show them as extras
            }
        });

        return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
    }, [meals, dbItems]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, AggregatedItem[]> = {};
        items.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [items]);

    const handleToggle = async (item: AggregatedItem, checked: boolean) => {
        // Optimistic Update
        const newDbItems = [...dbItems];

        try {
            if (item.shopping_list_id) {
                // Update existing
                await toggleShoppingItem(item.shopping_list_id, checked);
                setDbItems(prev => prev.map(i => i.id === item.shopping_list_id ? { ...i, is_purchased: checked } : i));
            } else {
                // Create new entry
                const { data, error } = await supabase
                    .from('shopping_list_items')
                    // @ts-ignore
                    .insert({
                        event_id: id,
                        ingredient_id: item.id, // using ingredient_id as link
                        quantity: item.quantity,
                        unit: item.unit,
                        is_purchased: checked
                    })
                    .select()
                    .single();

                if (error) throw error;
                // @ts-ignore
                if (data) setDbItems(prev => [...prev, data]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Erreur de sauvegarde");
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-3xl mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <Link href={`/calendar/${id}`} className="text-sm text-slate-500 hover:text-primary flex items-center gap-1 mb-4">
                        <ArrowLeft className="h-4 w-4" /> Retour au planning
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900">Liste de Courses</h1>
                            {event && <p className="text-slate-500">{event.title} • {items.length} articles</p>}
                        </div>
                        <Button variant="outline" onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Lien copié !");
                        }}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Partager le lien
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.entries(groupedItems).map(([category, catItems]) => (
                        <Card key={category} className="overflow-hidden">
                            <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">{category}</h3>
                                <Badge variant="secondary" className="bg-white text-slate-500">{catItems.length}</Badge>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {catItems.map(item => (
                                    <div key={item.id} className={`flex items-center p-4 gap-4 hover:bg-slate-50/50 transition-colors ${item.is_purchased ? 'bg-emerald-50/30' : ''}`}>
                                        <Checkbox
                                            id={`item-${item.id}`}
                                            checked={item.is_purchased}
                                            onCheckedChange={(checked: CheckedState) => handleToggle(item, checked as boolean)}
                                            className="h-6 w-6 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-primary"
                                        />
                                        <div className="flex-1">
                                            {item.category !== 'Divers' ? (
                                                <Link
                                                    href={`/ingredients/${item.id}`}
                                                    className={`text-base font-medium hover:underline ${item.is_purchased ? 'text-slate-400 line-through' : 'text-slate-900'}`}
                                                >
                                                    {item.name}
                                                </Link>
                                            ) : (
                                                <span className={`text-base font-medium select-none ${item.is_purchased ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                    {item.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-mono font-bold ${item.is_purchased ? 'text-slate-400' : 'text-slate-900'}`}>
                                                {Number(item.quantity).toFixed(1).replace(/\.0$/, '')}
                                            </span>
                                            <span className="text-xs text-slate-500 ml-1 uppercase">{item.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <ShoppingBasket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>Aucun ingrédient nécessaire pour le moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
