
"use client";

import { useEffect, useState, useCallback } from "react";
import {
    getMealsByDate, getEventMeals, deleteEvent, updateEvent, getEventById,
    addEventMeal, updateEventMeal, removeEventMeal, updateEventMealOrder,
    addEventMealIngredient, removeEventMealIngredient, updateEventMealIngredient,
    getShoppingList, upsertShoppingListItem,
} from "@/lib/api/calendar";
import { getSuppliers, createSupplier, Supplier } from "@/lib/api/suppliers";
import { getIngredientsLastPurchases } from "@/lib/api/ingredients";
import { ShoppingListItem } from "@/lib/types/calendar";
import { ShoppingRow } from "@/components/shopping/shopping-row";
import { EventMeal, Event } from "@/lib/types/calendar";
import { Loader2, Utensils, Trash2, CalendarDays, ExternalLink, Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { MealItem } from "@/components/calendar/meal-planning/meal-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShoppingListCalculation } from "@/hooks/use-shopping-list-calculation";
import { exportDailyShoppingListPDF } from "@/lib/pdf-export";
import { ShoppingBasket, FileDown, CheckSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { ShoppingListFilters } from "@/components/shopping/shopping-list-filters";

interface CalendarPreviewProps {
    date: Date | null;
    eventId: string | null;
    onEventUpdate?: () => void;
}

export function CalendarPreview({ date, eventId, onEventUpdate }: CalendarPreviewProps) {
    // @ts-ignore
    const [meals, setMeals] = useState<(EventMeal & { events: Event })[]>([]);
    const [eventDetails, setEventDetails] = useState<Event | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeEventId, setActiveEventId] = useState<string | null>(null);

    // Separate state for Global Daily Shopping List
    const [dailyShoppingMeals, setDailyShoppingMeals] = useState<EventMeal[]>([]);

    // Shopping List Persistence
    const [dbItems, setDbItems] = useState<ShoppingListItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const fetchData = useCallback(() => {
        // Only clear if switching context (e.g. from event to date or different event)
        // But if just refreshing, keep data to avoid jump

        if (eventId) {
            // If completely new event context, show loader
            if (activeEventId !== eventId) {
                setLoading(true);
                setMeals([]);
                setEventDetails(null);
                setActiveEventId(eventId);
            }

            // Fetch Event Details
            getEventById(eventId).then(setEventDetails).catch(console.error);

            // Fetch Shopping List & Suppliers
            Promise.all([
                getShoppingList(eventId),
                getSuppliers()
            ]).then(([items, sups]) => {
                setDbItems(items);
                setSuppliers(sups);
            }).catch(console.error);

            // Fetch All Meals for Event
            getEventMeals(eventId)
                .then(data => {
                    // @ts-ignore
                    const augmented = data.map(d => ({ ...d, events: { id: eventId, title: '...', color: 'gray', guest_count: d.target_servings } }));
                    setMeals(augmented as any);
                })
                .finally(() => setLoading(false));
        } else if (date) {
            setLoading(true);
            const dateStr = format(date, 'yyyy-MM-dd');
            getMealsByDate(dateStr)
                .then(data => setMeals(data))
                .finally(() => setLoading(false));

            // Just suppliers for date view if needed
            getSuppliers().then(setSuppliers).catch(console.error);
        }
    }, [date, eventId, activeEventId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateSupplier = async (name: string) => {
        try {
            // @ts-ignore
            const newSup = await createSupplier({ name });
            setSuppliers(prev => [...prev, newSup]);
            return newSup;
        } catch (e: any) {
            toast.error("Erreur création fournisseur");
            return null;
        }
    };

    const refreshItem = (updated: ShoppingListItem) => {
        setDbItems(prev => {
            const exists = prev.find(i => i.id === updated.id);
            if (exists) return prev.map(i => i.id === updated.id ? updated : i);
            return [...prev, updated];
        });
    };

    const handleDeleteEvent = async () => {
        if (!eventId || !confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
        try {
            await deleteEvent(eventId);
            toast.success("Événement supprimé");
            onEventUpdate?.();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!eventId) return;
        const formData = new FormData(e.currentTarget);
        try {
            await updateEvent(eventId, {
                start_date: formData.get("start_date") as string,
                end_date: formData.get("end_date") as string,
            });
            toast.success("Événement mis à jour");
            setIsEditOpen(false);
            onEventUpdate?.();
        } catch (error) {
            toast.error("Erreur de mise à jour");
        }
    };

    // --- Handlers for MealItem ---

    const handleAddMealSlot = async (evtId: string, dateStr: string, currentMeals: EventMeal[]) => {
        // Calculate next position
        const dayMeals = currentMeals.filter(m => m.date === dateStr);
        const nextPos = dayMeals.length > 0 ? Math.max(...dayMeals.map(m => m.position)) + 1 : 0;
        const existingGroups = new Set(dayMeals.map(m => m.position));
        const title = `Repas ${existingGroups.size + 1}`;

        try {
            // We need guest_count. If we have eventDetails use it, otherwise use 10 default
            const guestCount = eventDetails?.guest_count || 10;

            await addEventMeal({
                event_id: evtId,
                date: dateStr,
                meal_type: title,
                target_servings: guestCount,
                position: nextPos,
            });
            toast.success("Repas ajouté");
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Erreur ajout repas");
        }
    };

    const handleAddRecipeToGroup = async (evtId: string, dateStr: string, position: number, currentTitle: string, recipeId: string, currentMeals: EventMeal[], guestCount: number) => {
        // Check for existing empty slot in this group
        const dayMeals = currentMeals.filter(m => m.date === dateStr);
        const groupMeals = dayMeals.filter(m => m.position === position);
        const emptyMeal = groupMeals.find(m => !m.recipe_id);

        try {
            if (emptyMeal) {
                await updateEventMeal(emptyMeal.id, { recipe_id: recipeId });
                toast.success("Recette assignée");
            } else {
                await addEventMeal({
                    event_id: evtId,
                    date: dateStr,
                    meal_type: currentTitle,
                    target_servings: guestCount,
                    position: position,
                    recipe_id: recipeId
                });
                toast.success("Recette ajoutée");
            }
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Erreur ajout recette");
        }
    };

    const handleUpdateMealTitle = async (mealsInGroup: EventMeal[], newTitle: string) => {
        try {
            await Promise.all(mealsInGroup.map(m => updateEventMeal(m.id, { meal_type: newTitle })));
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Erreur renommage");
        }
    };

    const handleAddUnified = async (evtId: string, dateStr: string, position: number, currentTitle: string, type: 'recipe' | 'ingredient', id: string, name?: string, unit?: string) => {
        try {
            const guestCount = eventDetails?.guest_count || 10;
            // 1. Create a Meal Entry (Wrapper)
            const newMeal = await addEventMeal({
                event_id: evtId,
                date: dateStr,
                meal_type: currentTitle,
                target_servings: guestCount,
                position: position,
                recipe_id: type === 'recipe' ? id : undefined
            });

            // 2. If it's an ingredient, add the ingredient detail
            if (type === 'ingredient') {
                await addEventMealIngredient({
                    event_meal_id: newMeal.id,
                    ingredient_id: id,
                    quantity: 1,
                    unit: unit || 'kg'
                });
                toast.success("Ingrédient ajouté");
            } else {
                toast.success("Recette ajoutée");
            }

            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Erreur d'ajout");
        }
    };


    // --- Derived State (Must be safe before hooks) ---

    // Group meals by Date -> Meal Type
    const groupedByDay: Record<string, typeof meals> = {};
    meals.forEach(meal => {
        const d = meal.date;
        if (!groupedByDay[d]) groupedByDay[d] = [];
        groupedByDay[d].push(meal);
    });

    const sortedDates = Object.keys(groupedByDay).sort();

    // State to control which day we are viewing in Shopping List (and potential filter for Planning)
    const [selectedFilterDate, setSelectedFilterDate] = useState<string | null>(null);

    // Initialize/Sync selectedFilterDate when sortedDates changes or eventId changes
    useEffect(() => {
        // If we switched to an EVENT, force ALL by default (unless user manually changed it, but here we prioritize Reset on Event Switch)
        // We can check if eventId changed or just force it if present
        if (eventId) {
            // Only force if we are NOT already on ALL (or if we just mounted/switched event)
            // Ideally we want to persist it if user is just navigating tabs, but reset if swapping events.
            // Given the props `eventId` changing usually means new selection:
            if (selectedFilterDate !== 'ALL') {
                // But wait, if user selected a specific day inside the event, we don't want to reset it on every render?
                // No, useEffect runs on dependency change. `eventId` changes.
            }
            // Simplified: When eventId changes, we should probably reset to ALL.
        }
    }, [eventId]);

    // Actually, better logic:
    // If eventId is present, and we have no state, or if eventId CHANGED (we need previous ref? no, key changes remount component usually? No component is reused in layout usually).
    // CalendarPreview is likely kept.

    // Let's rely on the previous logic but making it stronger for the "eventId implies ALL default" rule.
    useEffect(() => {
        if (eventId) {
            // Use functional update or just set it. 
            // We want to ensure that when we CLICK an event (eventId changes), we see ALL.
            setSelectedFilterDate('ALL');
        } else {
            // If we are in date mode, selectedFilterDate isn't really used as filter for "ALL", it's just null or specific date.
            setSelectedFilterDate(null);
        }
    }, [eventId, date]); // Dependency on eventId/date switching context.

    // Note: sortedDates might load later. But 'ALL' is valid immediately for event mode.

    const targetDateStr = selectedFilterDate || sortedDates[0];
    const targetDateObj = targetDateStr ? parseISO(targetDateStr) : (date || new Date());

    // --- Hooks (Must act unconditionally) ---

    // Fetch Global Meals for Shopping List whenever targetDateStr changes
    // Fetch Global Meals for Shopping List whenever targetDateStr changes
    useEffect(() => {
        if (!targetDateStr) {
            setDailyShoppingMeals([]);
            return;
        }

        if (targetDateStr === 'ALL') {
            // If ALL, use all fetched meals (which are already in `meals` if eventId is set)
            setDailyShoppingMeals(meals);
        } else if (eventId) {
            // If Event mode but specific date, filter locally from `meals`
            // This is instantly responsive and saves network calls
            const filtered = meals.filter(m => m.date === targetDateStr);
            setDailyShoppingMeals(filtered);
        } else {
            // Date mode (no eventId), must fetch global meals for that date
            getMealsByDate(targetDateStr)
                .then(data => setDailyShoppingMeals(data))
                .catch(console.error);
        }
    }, [targetDateStr, meals, eventId]);

    // Hook
    const effectiveEvent = eventDetails || (meals[0]?.events) || { guest_count: 10, title: 'Événement' };

    // Always call hook, handle empty data inside
    const { items: shoppingItems, groupedItems } = useShoppingListCalculation({
        meals: dailyShoppingMeals,
        event: effectiveEvent,
        dbItems: dbItems,
        guestCount: eventDetails?.guest_count // Explicit fallback
    });

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

    // Logic to toggle
    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };
    const toggleSupplier = (id: string) => {
        setSelectedSupplierIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    const resetFilters = () => {
        setSelectedCategories([]);
        setSelectedSupplierIds([]);
    };

    // Calculate lists
    const uniqueCategories = Array.from(new Set(shoppingItems.map(i => i.category))).sort();

    // Get unique suppliers explicitly present in the items
    const usedSupplierIds = new Set(shoppingItems.map(i => i.supplier_id).filter(Boolean));
    const availableFilterSuppliers = suppliers.filter(s => usedSupplierIds.has(s.id));

    const filteredItems = shoppingItems.filter(item => {
        const catMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category);
        const supMatch = selectedSupplierIds.length === 0 || (item.supplier_id && selectedSupplierIds.includes(item.supplier_id));
        return catMatch && supMatch;
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));


    // --- Rendering Logic (Early returns are now just conditional rendering blocks) ---

    if (loading) return (
        <div className="flex justify-center py-10 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
    );

    // --- Empty State Check ---
    if (!eventId && !date) return <div className="text-center py-10 text-slate-400">Sélectionnez une date ou un événement.</div>;

    if (meals.length === 0) return (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Utensils className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-slate-500">Aucun menu prévu.</p>
            {/* If we have eventId, show button to add meal */}
            {eventId && eventDetails && (
                <Button variant="link" onClick={() => handleAddMealSlot(eventId, format(parseISO(eventDetails.start_date), 'yyyy-MM-dd'), [])} className="text-primary mt-2">
                    Ajouter un premier repas
                </Button>
            )}
        </div>
    );


    const handleExportPDF = () => {
        exportDailyShoppingListPDF({
            eventName: effectiveEvent.title || "Événement",
            date: targetDateObj,
            guestCount: effectiveEvent.guest_count || 10,
            items: shoppingItems,
            // We don't have easy access to allergens/diets aggregate here without calculation, passing empty for now or extracting from recipes if we want perfect Detail.
            // For now, keep simple.
        });
    };



    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-sm p-6 space-y-6">
            {/* ... (Header and TabsList same as before) ... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                {/* ... Header Content ... */}
                <div>
                    {eventId && eventDetails ? (
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">{eventDetails.title}</h3>
                                <Badge variant="outline">{eventDetails.guest_count} pers.</Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                Du {format(parseISO(eventDetails.start_date), 'd MMMM')} au {format(parseISO(eventDetails.end_date), 'd MMMM yyyy', { locale: fr })}
                            </p>
                        </div>
                    ) : (
                        <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                            {date && format(date, 'EEEE d MMMM', { locale: fr })}
                        </h3>
                    )}
                </div>

                {/* Actions */}
                {eventId && eventDetails && (
                    <div className="flex gap-2">
                        <Link href={`/calendar/${eventId}`}>
                            <Button variant="ghost" size="icon" title="Modifier l'événement">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDeleteEvent} title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Link href={`/calendar/${eventId}`}>
                            <Button variant="ghost" size="icon" title="Ouvrir le Planning">
                                <Utensils className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <Tabs defaultValue="planning" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="planning" className="flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Planification
                    </TabsTrigger>
                    <TabsTrigger value="shopping" className="flex items-center gap-2">
                        <ShoppingBasket className="h-4 w-4" />
                        Liste de courses ({shoppingItems.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="planning" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    {/* ... Planning Content (unchanged) ... */}
                    {sortedDates.length === 0 && <p className="text-slate-400 italic">Aucun repas planifié pour cette sélection.</p>}

                    {sortedDates.map(dateStr => {
                        const dayMeals = groupedByDay[dateStr];
                        const dateObj = parseISO(dateStr);
                        const mealsByEvent: Record<string, { event: Event, meals: typeof meals }> = {};
                        dayMeals.forEach(m => {
                            const evtId = m.events?.id || 'unknown';
                            if (!mealsByEvent[evtId]) mealsByEvent[evtId] = { event: m.events, meals: [] };
                            mealsByEvent[evtId].meals.push(m);
                        });

                        return (
                            <div key={dateStr} className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center justify-between">
                                    <span>{format(dateObj, 'EEEE d MMMM', { locale: fr })}</span>
                                    {eventId && (
                                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:bg-primary/10" onClick={() => handleAddMealSlot(eventId, dateStr, meals)}>
                                            + Ajouter un repas
                                        </Button>
                                    )}
                                </h4>
                                <div className="space-y-8">
                                    {Object.values(mealsByEvent).map(({ event, meals: eventMeals }) => {
                                        const groups: Record<number, EventMeal[]> = {};
                                        eventMeals.forEach(m => { if (!groups[m.position]) groups[m.position] = []; groups[m.position].push(m); });
                                        const sortedGroups = Object.entries(groups).map(([pos, groupMeals]) => ({ position: parseInt(pos), meals: groupMeals })).sort((a, b) => a.position - b.position);

                                        return (
                                            <div key={event?.id || 'unknown'} className="space-y-4">
                                                <div className="space-y-6">
                                                    {sortedGroups.map((group) => (
                                                        <MealItem
                                                            key={`${dateStr}-${group.position}-${event?.id}`}
                                                            meals={group.meals}
                                                            position={group.position}
                                                            onAddRecipe={(title, recipeId) => handleAddRecipeToGroup(event?.id || eventId || '', dateStr, group.position, title, recipeId, meals, event?.guest_count || 10)}
                                                            onUpdateRecipe={(mealId, recipeId) => updateEventMeal(mealId, { recipe_id: recipeId }).then(fetchData)}
                                                            onRemoveRecipe={(mealId) => removeEventMeal(mealId).then(fetchData)}
                                                            onUpdateTitle={(newTitle) => handleUpdateMealTitle(group.meals, newTitle)}
                                                            onUpdateServings={(mealId, updates) => updateEventMeal(mealId, updates).then(fetchData)}
                                                            onUpdateMealTime={(mealId, time) => updateEventMeal(mealId, { meal_time: time }).then(fetchData)}
                                                            restrictedAllergens={[]}
                                                            guestCount={event?.guest_count || 10}
                                                            onDeleteMealSlot={async () => {
                                                                try { await Promise.all(group.meals.map(m => removeEventMeal(m.id))); toast.success("Groupe de repas supprimé"); fetchData(); } catch (e) { console.error(e); toast.error("Erreur suppression"); }
                                                            }}
                                                            onAddIngredient={(ingredientId, quantity, unit) => {
                                                                handleAddUnified(event?.id || eventId || '', dateStr, group.position, "Repas", 'ingredient', ingredientId, undefined, unit);
                                                            }}
                                                            onUpdateIngredient={(mealId, ingredientId, updates) => {
                                                                updateEventMealIngredient(ingredientId, updates).then(() => fetchData()).catch(() => toast.error("Erreur mise à jour"));
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </TabsContent>

                <TabsContent value="shopping" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-4">
                        {/* Top Bar: Title + Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800">Liste des courses</h4>
                                <p className="text-sm text-slate-500">
                                    {targetDateStr === 'ALL' ? "Vue globale" : "Vue journalière"} • {shoppingItems.length} articles
                                </p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {/* Grand Total Display */}
                                <div className="hidden sm:flex flex-col justify-center px-3 py-1 bg-slate-100/50 rounded border border-slate-200">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Estimé</span>
                                    <span className="text-sm font-bold text-emerald-600">
                                        {shoppingItems.reduce((sum, item) => sum + (item.allocated_cost || 0), 0).toFixed(2)} €
                                    </span>
                                </div>

                                <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => setIsFilterOpen(true)}>
                                    <Filter className="h-4 w-4" />
                                    Filtres
                                    {(selectedCategories.length + selectedSupplierIds.length) > 0 && (
                                        <Badge variant="secondary" className="bg-slate-100 ml-1 h-5 px-1.5 text-[10px]">
                                            {selectedCategories.length + selectedSupplierIds.length}
                                        </Badge>
                                    )}
                                </Button>
                                <Button onClick={handleExportPDF} size="sm" className="bg-slate-900 text-white hover:bg-slate-800 gap-2 flex-1 sm:flex-none">
                                    <FileDown className="h-4 w-4" />
                                    PDF
                                </Button>
                            </div>
                        </div>

                        {/* Date Selector Row */}
                        {(sortedDates.length > 0 && eventId) ? (
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Vue :</span>
                                <select
                                    className="text-sm bg-white border border-slate-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                                    value={targetDateStr || ''}
                                    onChange={(e) => setSelectedFilterDate(e.target.value)}
                                >
                                    <option value="ALL">Tout l'événement ({sortedDates.length} jours)</option>
                                    <optgroup label="Par jour">
                                        {sortedDates.map(d => (
                                            <option key={d} value={d}>
                                                {format(parseISO(d), 'EEEE d MMMM', { locale: fr })}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        ) : null}
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <p className="text-slate-400">Aucun ingrédient ne correspond à votre recherche.</p>
                            {(selectedCategories.length > 0 || selectedSupplierIds.length > 0) && (
                                <Button variant="link" onClick={resetFilters} className="mt-2 text-primary">
                                    Réinitialiser les filtres
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="bg-slate-50/50 px-4 py-2 border-b text-xs font-semibold text-slate-500 uppercase flex justify-between">
                                <span>Article</span>
                                <span className="hidden sm:inline">Détails</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {filteredItems.map(item => (
                                    <ShoppingRow
                                        key={item.id}
                                        item={item}
                                        eventId={effectiveEvent.id || eventId || 'temp'}
                                        suppliers={suppliers}
                                        onUpdate={refreshItem}
                                        onCreateSupplier={handleCreateSupplier}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <ShoppingListFilters
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                availableCategories={uniqueCategories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                availableSuppliers={availableFilterSuppliers}
                selectedSuppliers={selectedSupplierIds}
                onToggleSupplier={toggleSupplier}
                onReset={resetFilters}
            />
        </div >
    );
}
