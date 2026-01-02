import { useState, useEffect } from "react";
import { EventMeal } from "@/lib/types/calendar";
import { X, Plus, Minus, UtensilsCrossed, Trash2, ChevronDown, ChevronUp, Carrot, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { UnifiedEntrySelector } from "@/components/calendar/unified-entry-selector";
import { RecipeSelector } from "@/components/calendar/recipe-selector";

interface MealItemProps {
    meals: EventMeal[];
    position: number;
    onAddRecipe: (title: string, recipeId: string) => void;
    onUpdateRecipe: (mealId: string, recipeId: string) => void;
    onRemoveRecipe: (mealId: string) => void;
    onUpdateTitle: (t: string) => void;
    onUpdateServings: (mealId: string, updates: { target_servings_small?: number, target_servings_large?: number }) => void;
    onUpdateMealTime: (mealId: string, time: string) => void;

    // Ingredient Props
    onAddIngredient: (ingredientId: string, quantity: number, unit: string) => void;
    onUpdateIngredient: (mealId: string, ingredientId: string, updates: { quantity?: number }) => void;
    onMoveMeal?: (mealId: string, direction: 'up' | 'down') => void;

    restrictedAllergens: string[];
    guestCount: number;
    onDeleteMealSlot?: () => void;
}

export function MealItem({
    meals,
    position,
    onAddRecipe,
    onUpdateRecipe,
    onRemoveRecipe,
    onUpdateTitle,
    onUpdateServings,
    onUpdateMealTime,
    onAddIngredient,
    onUpdateIngredient,
    onMoveMeal,
    restrictedAllergens,
    guestCount,
    onDeleteMealSlot
}: MealItemProps) {
    const [title, setTitle] = useState(meals[0]?.meal_type || "Nouveau Repas");
    const [time, setTime] = useState(meals[0]?.meal_time || "");

    useEffect(() => {
        if (meals[0]?.meal_type) setTitle(meals[0].meal_type);
        if (meals[0]?.meal_time) setTime(meals[0].meal_time);
    }, [meals]);

    const handleTitleBlur = () => {
        if (title !== meals[0]?.meal_type) {
            onUpdateTitle(title);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTime(newTime);
    };

    const handleTimeBlur = () => {
        if (meals[0] && time !== meals[0].meal_time) {
            onUpdateMealTime(meals[0].id, time);
        }
    };

    return (
        <div className="bg-slate-50/50 border rounded-xl p-4 space-y-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        className="font-serif text-lg font-bold bg-slate-50/50 border border-transparent hover:border-slate-200 hover:bg-white focus:bg-white focus:border-slate-300 px-2 rounded-md h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300 text-slate-900 transition-all"
                        placeholder="Nom du repas (ex: Déjeuner, Dîner...)"
                    />
                </div>

                <div className="flex items-center gap-2 text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                    <Clock className="h-4 w-4" />
                    <input
                        type="time"
                        value={time}
                        onChange={handleTimeChange}
                        onBlur={handleTimeBlur}
                        className="bg-transparent border-none text-sm outline-none w-20 cursor-pointer"
                    />
                </div>

                {onDeleteMealSlot && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={onDeleteMealSlot}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Items List */}
            <div className="space-y-3">
                {meals.map((meal, index) => {
                    const isRecipe = !!meal.recipe_id;
                    const isFirst = index === 0;
                    const isLast = index === meals.length - 1;

                    if (isRecipe) {
                        return (
                            <RecipeCard
                                key={meal.id}
                                meal={meal}
                                guestCount={guestCount}
                                onRemoveRecipe={onRemoveRecipe}
                                onUpdateRecipe={onUpdateRecipe}
                                onUpdateServings={onUpdateServings}
                                onUpdateMealTime={onUpdateMealTime}
                                restrictedAllergens={restrictedAllergens}
                                isFirst={isFirst}
                                isLast={isLast}
                                onMove={onMoveMeal}
                            />
                        );
                    } else {
                        // Standalone Ingredient Mode
                        if (meal.meal_ingredients && meal.meal_ingredients.length > 0) {
                            return (
                                <IngredientCard
                                    key={meal.id}
                                    meal={meal}
                                    onRemove={() => onRemoveRecipe(meal.id)} // Remove the whole meal entry
                                    onUpdate={(qty: number) => {
                                        const ing = meal.meal_ingredients![0];
                                        if (ing) onUpdateIngredient(meal.id, ing.id, { quantity: qty });
                                    }}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    onMove={onMoveMeal}
                                />
                            );
                        }
                        return null;
                    }
                })}
            </div>

            {/* Unified Add Button at bottom of group */}
            <div className="relative">
                <UnifiedEntrySelector
                    onSelectRecipe={(id, title) => onAddRecipe(title, id)}
                    onSelectIngredient={(id, name, unit) => onAddIngredient(id, 1, unit)}
                    placeholder="Ajouter une recette ou un ingrédient..."
                />
            </div>
        </div>
    );
}

export function RecipeCard({ meal, guestCount, onRemoveRecipe, onUpdateRecipe, onUpdateServings, onUpdateMealTime, isFirst, isLast, onMove }: any) {
    const [activeServings, setActiveServings] = useState(meal.target_servings || guestCount);
    const router = useRouter();

    // Effect to sync local state if props change (e.g. from DB update)
    useEffect(() => {
        if (meal.target_servings) setActiveServings(meal.target_servings);
    }, [meal.target_servings]);

    return (
        <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col gap-3 relative group/card hover:border-emerald-200 hover:shadow-md transition-all">
            <div className="flex gap-4">
                {/* Image */}
                <div
                    className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-slate-100 relative group/image cursor-pointer z-10"
                    onClick={(e) => { e.stopPropagation(); router.push(`/recipes/${meal.recipes?.id}/cook?servings=${activeServings}`); }}
                >
                    {meal.recipes?.image_url ? (
                        <img src={meal.recipes.image_url} className="w-full h-full object-cover" alt={meal.recipes.title} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><UtensilsCrossed className="w-8 h-8" /></div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-3">
                    <h4 className="font-bold text-slate-900 line-clamp-1 hover:text-primary cursor-pointer transition-colors text-lg font-serif" onClick={() => router.push(`/recipes/${meal.recipes?.id}`)}>
                        {meal.recipes?.title}
                    </h4>
                    {/* Portion Controls */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5" onPointerDown={e => e.stopPropagation()}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateServings(meal.id, { target_servings_small: activeServings, target_servings_large: 0 }); }} className={cn("px-2 py-1 text-xs font-medium rounded-md transition-all", meal.target_servings_small ? "bg-white shadow text-slate-700" : "text-slate-400 hover:text-slate-600")}>Petite</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateServings(meal.id, { target_servings_small: 0, target_servings_large: 0 }); }} className={cn("px-2 py-1 text-xs font-medium rounded-md transition-all", !meal.target_servings_small ? "bg-white shadow text-slate-700" : "text-slate-400 hover:text-slate-600")}>Standard</button>
                        </div>
                        <div className="flex items-center gap-2" onPointerDown={e => e.stopPropagation()}>
                            <div className="flex items-center bg-slate-100 rounded-md">
                                <button className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded-l-md" onClick={(e) => { e.stopPropagation(); onUpdateServings(meal.id, { target_servings_small: meal.target_servings_small ? activeServings - 1 : 0, target_servings_large: meal.target_servings_large ? activeServings - 1 : 0 }); setActiveServings((s: number) => Math.max(1, s - 1)); }}>-</button>
                                <span className="w-8 text-center text-sm font-bold text-slate-700">{activeServings}</span>
                                <button className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded-r-md" onClick={(e) => { e.stopPropagation(); onUpdateServings(meal.id, { target_servings_small: meal.target_servings_small ? activeServings + 1 : 0, target_servings_large: meal.target_servings_large ? activeServings + 1 : 0 }); setActiveServings((s: number) => s + 1); }}>+</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions (Move & Delete) */}
                <div className="flex flex-col items-center gap-1">
                    {onMove && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                                disabled={isFirst}
                                onClick={(e) => { e.stopPropagation(); onMove(meal.id, 'up'); }}
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                                disabled={isLast}
                                onClick={(e) => { e.stopPropagation(); onMove(meal.id, 'down'); }}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-300 hover:text-red-500 mt-auto"
                        onClick={(e) => { e.stopPropagation(); onRemoveRecipe(meal.id); }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function IngredientCard({ meal, onRemove, onUpdate, isFirst, isLast, onMove }: any) {
    // Assume first ingredient is the one
    const ingredient = meal.meal_ingredients?.[0];
    const [qty, setQty] = useState(ingredient?.quantity || 1);

    // Step Logic
    const getStep = (u: string) => {
        const unit = u?.toLowerCase() || '';
        if (['kg', 'l'].includes(unit)) return 0.1;
        if (['g', 'cl', 'ml'].includes(unit)) return 10;
        return 0.1; // Default
    };

    const step = getStep(ingredient?.unit || '');

    useEffect(() => { setQty(ingredient?.quantity || 1); }, [ingredient]);

    const handleUpdate = (val: number) => {
        const safe = Math.max(0, Number(val.toFixed(2)));
        setQty(safe);
        onUpdate(safe);
    }

    if (!ingredient) return null;

    return (
        <div className="bg-white border rounded-lg p-3 shadow-sm flex items-center gap-4 relative group/card hover:border-orange-200 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-md bg-orange-50 flex items-center justify-center text-orange-400 flex-shrink-0 border border-orange-100">
                <Carrot className="w-6 h-6" />
            </div>

            <div className="flex-1 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-slate-900 text-lg font-serif">{ingredient.ingredients?.name}</h4>
                    <p className="text-xs text-slate-400">Ingrédient à la carte</p>
                </div>

                <div className="flex items-center gap-2" onPointerDown={e => e.stopPropagation()}>
                    <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm h-8">
                        <button onClick={(e) => { e.stopPropagation(); handleUpdate(Number(qty) - step); }} className="px-2 h-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 border-r border-slate-100"><Minus className="w-3 h-3" /></button>
                        <div className="min-w-[4rem] text-center font-mono text-sm font-bold text-slate-700 px-2 flex items-center justify-center gap-1">
                            {qty} <span className="text-xs font-normal text-slate-400">{ingredient.unit}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleUpdate(Number(qty) + step); }} className="px-2 h-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 border-l border-slate-100"><Plus className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

            {/* Actions (Move & Delete) */}
            <div className="flex flex-col items-center gap-1">
                {onMove && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                            disabled={isFirst}
                            onClick={(e) => { e.stopPropagation(); onMove(meal.id, 'up'); }}
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                            disabled={isLast}
                            onClick={(e) => { e.stopPropagation(); onMove(meal.id, 'down'); }}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-300 hover:text-red-500 mt-auto"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
