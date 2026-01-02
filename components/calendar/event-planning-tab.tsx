
"use client";

import { useMemo, useState } from "react";
import { Event, EventMeal } from "@/lib/types/calendar";
import { addDays, format, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronRight, ChevronDown } from "lucide-react";
import { addEventMeal, removeEventMeal, updateEventMeal, getEventMeals, addEventMealIngredient, removeEventMealIngredient, updateEventMealIngredient, updateEventMealOrder } from "@/lib/api/calendar";
import { MealItem } from "@/components/calendar/meal-planning/meal-item";
import { UnifiedEntrySelector } from "@/components/calendar/unified-entry-selector";

interface EventPlanningTabProps {
    event: Event;
    meals: EventMeal[];
    setMeals: React.Dispatch<React.SetStateAction<EventMeal[]>>;
}

export function EventPlanningTab({ event, meals, setMeals }: EventPlanningTabProps) {
    // ... useMemo for days ...
    const days = useMemo(() => {
        if (!event) return [];
        const start = parseISO(event.start_date);
        const end = parseISO(event.end_date);
        const dayCount = differenceInDays(end, start) + 1;

        return Array.from({ length: dayCount }).map((_, i) => {
            const date = addDays(start, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            // Filter meals for this day
            const dayMealsRaw = meals.filter(m => m.date === dateStr);

            // Group by position
            const groups: Record<number, EventMeal[]> = {};
            dayMealsRaw.forEach(m => {
                if (!groups[m.position]) groups[m.position] = [];
                groups[m.position].push(m);
            });

            // Convert to sorted array of groups
            const dayMealGroups = Object.entries(groups)
                .map(([pos, groupMeals]) => ({
                    position: parseInt(pos),
                    meals: groupMeals
                }))
                .sort((a, b) => a.position - b.position);

            return {
                date,
                dateStr,
                mealGroups: dayMealGroups,
                totalMeals: dayMealGroups.length
            };
        });
    }, [event, meals]);

    const handleAddMealSlot = async (dateStr: string) => {
        // ... same impl ...
        if (!event) return;
        const dayMeals = meals.filter(m => m.date === dateStr);
        const nextPos = dayMeals.length > 0 ? Math.max(...dayMeals.map(m => m.position)) + 1 : 0;
        const existingGroups = new Set(dayMeals.map(m => m.position));
        const title = `Repas ${existingGroups.size + 1}`;

        try {
            const newMeal = await addEventMeal({
                event_id: event.id,
                date: dateStr,
                meal_type: title,
                target_servings: event.guest_count || 10,
                position: nextPos,
            });
            setMeals(prev => [...prev, newMeal]); // Wait, empty meal logic might need adjustment if we want it to be "Empty" but present
            toast.success("Repas ajouté");
        } catch (err) {
            console.error(err);
            toast.error("Erreur ajout repas");
        }
    };

    // Unified Adding Logic
    const handleAddUnified = async (dateStr: string, position: number, currentTitle: string, type: 'recipe' | 'ingredient', id: string, name?: string, unit?: string) => {
        if (!event) return;

        try {
            // 1. Create a Meal Entry (Wrapper)
            const newMeal = await addEventMeal({
                event_id: event.id,
                date: dateStr,
                meal_type: currentTitle,
                target_servings: event.guest_count || 10,
                position: position,
                recipe_id: type === 'recipe' ? id : undefined // Set recipe if recipe
            });

            // 2. If it's an ingredient, add the ingredient detail
            if (type === 'ingredient') {
                await addEventMealIngredient({
                    event_meal_id: newMeal.id,
                    ingredient_id: id,
                    quantity: 1, // Default, will be adjustable
                    unit: unit || 'kg'
                });
            }

            toast.success(type === 'recipe' ? "Recette ajoutée" : "Ingrédient ajouté");
            const updated = await getEventMeals(event.id);
            setMeals(updated);

        } catch (err) {
            console.error(err);
            toast.error("Erreur d'ajout");
        }
    };

    const handleUpdateMealTitle = async (mealsInGroup: EventMeal[], newTitle: string) => {
        // Optimistic update
        setMeals(prev => prev.map(m => mealsInGroup.some(g => g.id === m.id) ? { ...m, meal_type: newTitle } : m));
        try {
            await Promise.all(mealsInGroup.map(m => updateEventMeal(m.id, { meal_type: newTitle })));
        } catch (err) {
            console.error(err);
            toast.error("Erreur renommage");
        }
    };

    const handleUpdateMealTimeGroup = async (mealsInGroup: EventMeal[], time: string) => {
        // Optimistic update
        setMeals(prev => prev.map(m => mealsInGroup.some(g => g.id === m.id) ? { ...m, meal_time: time } : m));
        try {
            await Promise.all(mealsInGroup.map(m => updateEventMeal(m.id, { meal_time: time })));
        } catch (err) {
            console.error(err);
            toast.error("Erreur mise à jour heure");
        }
    };

    const handleMoveMeal = async (mealId: string, direction: 'up' | 'down') => {
        const meal = meals.find(m => m.id === mealId);
        if (!meal) return;

        const groupMeals = meals.filter(m => m.date === meal.date && m.position === meal.position)
            .sort((a, b) => (a.order_in_slot || 0) - (b.order_in_slot || 0));

        const index = groupMeals.findIndex(m => m.id === mealId);
        if (index === -1) return;

        const neighborIndex = direction === 'up' ? index - 1 : index + 1;
        if (neighborIndex < 0 || neighborIndex >= groupMeals.length) return;

        const neighbor = groupMeals[neighborIndex];

        // Force explicit index ordering
        const updates = [
            { id: meal.id, order_in_slot: neighborIndex },
            { id: neighbor.id, order_in_slot: index }
        ];

        setMeals(prev => prev.map(m => {
            if (m.id === meal.id) return { ...m, order_in_slot: neighborIndex };
            if (m.id === neighbor.id) return { ...m, order_in_slot: index };
            return m;
        }));

        try {
            await updateEventMealOrder(updates);
            getEventMeals(event.id).then(setMeals);
        } catch (err) {
            console.error(err);
            toast.error("Erreur de déplacement");
        }
    };

    // State for collapsed days
    // We use a simple map. If not present, default depends on total days.
    const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>({});

    const toggleDay = (dateStr: string) => {
        setCollapsedState(prev => ({
            ...prev,
            [dateStr]: !(prev[dateStr] ?? (days.length > 1))
        }));
    };

    return (
        <div className="space-y-4">
            {days.map((day) => {
                const isCollapsed = collapsedState[day.dateStr] ?? (days.length > 1);

                return (
                    <div key={day.dateStr} className="border rounded-xl bg-white shadow-sm overflow-hidden">
                        {/* Header Trigger */}
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleDay(day.dateStr)}
                        >
                            <div className="flex items-center gap-3">
                                {isCollapsed ? <ChevronRight className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                <h3 className="text-lg font-serif font-bold text-slate-800 capitalize">
                                    {format(day.date, 'EEEE d MMMM', { locale: fr })}
                                </h3>
                                <Badge variant="secondary" className="text-slate-500 font-normal">
                                    {day.totalMeals} repas
                                </Badge>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleAddMealSlot(day.dateStr); }}
                                className="text-slate-600 border-dashed"
                            >
                                + Repas
                            </Button>
                        </div>

                        {!isCollapsed && (
                            <div className="p-4 pt-0 space-y-6 border-t border-slate-100 bg-slate-50/30">
                                <div className="mt-4 space-y-6">
                                    {day.mealGroups.map((group) => (
                                        <MealItem
                                            key={`${day.dateStr}-${group.position}`}
                                            meals={group.meals}
                                            position={group.position}
                                            onAddRecipe={(title, recipeId) => handleAddUnified(day.dateStr, group.position, group.meals[0]?.meal_type || "Repas", 'recipe', recipeId)}
                                            onAddIngredient={(ingId, qty, unit) => handleAddUnified(day.dateStr, group.position, group.meals[0]?.meal_type || "Repas", 'ingredient', ingId, undefined, unit)}
                                            onUpdateRecipe={(mealId, recipeId) => updateEventMeal(mealId, { recipe_id: recipeId }).then(() => getEventMeals(event.id).then(setMeals))}
                                            onRemoveRecipe={(mealId) => removeEventMeal(mealId).then(() => getEventMeals(event.id).then(setMeals))}
                                            onUpdateTitle={(newTitle) => handleUpdateMealTitle(group.meals, newTitle)}
                                            onUpdateServings={(mealId, updates) => updateEventMeal(mealId, updates).then(() => getEventMeals(event.id).then(setMeals))}
                                            onUpdateMealTime={(mealId, time) => handleUpdateMealTimeGroup(group.meals, time)}
                                            onUpdateIngredient={(mealId, ingId, updates) => updateEventMealIngredient(ingId, updates).then(() => getEventMeals(event.id).then(setMeals))}
                                            restrictedAllergens={[]}
                                            guestCount={event.guest_count || 1}
                                            onDeleteMealSlot={async () => {
                                                if (!confirm("Supprimer ce repas et tous ses éléments ?")) return;
                                                try {
                                                    await Promise.all(group.meals.map(m => removeEventMeal(m.id)));
                                                    toast.success("Repas supprimé");
                                                    getEventMeals(event.id).then(setMeals);
                                                } catch (e) { console.error(e); toast.error("Erreur suppression"); }
                                            }}
                                            onMoveMeal={handleMoveMeal}
                                        />
                                    ))}

                                    {day.mealGroups.length === 0 && (
                                        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center gap-4 transition-colors hover:bg-slate-50">
                                            <p className="text-slate-500 font-medium">Aucun repas prévu pour ce jour.</p>
                                            <Button variant="outline" onClick={() => handleAddMealSlot(day.dateStr)}>
                                                Ajouter un premier repas
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
