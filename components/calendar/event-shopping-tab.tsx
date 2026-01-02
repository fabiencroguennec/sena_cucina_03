"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { getShoppingList, upsertShoppingListItem } from "@/lib/api/calendar";
import { getSuppliers, createSupplier, Supplier } from "@/lib/api/suppliers";
import { getIngredientsLastPurchases } from "@/lib/api/ingredients";
import { Event, EventMeal, ShoppingListItem } from "@/lib/types/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShoppingBasket, Check, ChevronsUpDown, Star, FileDown, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { exportShoppingListPDF } from "@/lib/pdf-export";
import { useShoppingListCalculation, AggregatedItem } from "@/hooks/use-shopping-list-calculation";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn, removeAccents } from "@/lib/utils";
import { debounce } from "lodash";
import { CATEGORY_OPTIONS } from "@/lib/validators/ingredient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingRow } from "@/components/shopping/shopping-row";

interface EventShoppingTabProps {
    event: Event;
    meals: EventMeal[];
}

export function EventShoppingTab({ event, meals }: EventShoppingTabProps) {
    const [dbItems, setDbItems] = useState<ShoppingListItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [lastPurchases, setLastPurchases] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Filter state

    useEffect(() => {
        if (event?.id) {
            Promise.all([
                getShoppingList(event.id),
                getSuppliers()
            ]).then(([items, sups]) => {
                setDbItems(items);
                setSuppliers(sups);
            })
                .catch(console.error)
                .finally(() => setLoading(false));

            // Fetch Last Purchases for Auto-Fill
            const ingIds = new Set<string>();
            meals.forEach(m => {
                // @ts-ignore
                m.recipes?.recipe_items?.forEach((ri: any) => ri.ingredients && ingIds.add(ri.ingredients.id));
                // @ts-ignore
                m.meal_ingredients?.forEach((mi: any) => mi.ingredients && ingIds.add(mi.ingredients.id));
            });

            if (ingIds.size > 0) {
                getIngredientsLastPurchases(Array.from(ingIds))
                    .then(setLastPurchases)
                    .catch(e => console.error("Error fetching last purchases", e));
            }
        }
    }, [event]);

    const { items, groupedItems } = useShoppingListCalculation({
        meals,
        event,
        dbItems,
        lastPurchases
    });

    const refreshItem = (updated: ShoppingListItem) => {
        setDbItems(prev => {
            const exists = prev.find(i => i.id === updated.id);
            if (exists) return prev.map(i => i.id === updated.id ? updated : i);
            return [...prev, updated];
        });
    };

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

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" /></div>;

    // Filter Logic
    const displayedCategories = selectedCategories.length > 0
        ? selectedCategories
        : Object.keys(groupedItems);

    // If NO filter is selected, we want a FLAT list (requirements: "affiche la liste complete sans separer par categorie").
    // So if selectedCategories is empty, we iterate over `items`.
    // If selectedCategories is NOT empty, we iterate over `displayedCategories` and show Cards.

    const isFiltered = selectedCategories.length > 0;

    return (
        <div className="space-y-6">
            {/* Toolbar: Share, PDF, Filter */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
                {/* Filter */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("border-dashed", isFiltered && "border-primary bg-primary/5 text-primary")}>
                                <Filter className="mr-2 h-4 w-4" />
                                {isFiltered ? `${selectedCategories.length} filtres` : "Filtrer par catégorie"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Catégories..." />
                                <CommandList>
                                    <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                                    <CommandGroup>
                                        {CATEGORY_OPTIONS.map((cat) => {
                                            const isSelected = selectedCategories.includes(cat.value);
                                            return (
                                                <CommandItem
                                                    key={cat.value}
                                                    onSelect={() => {
                                                        setSelectedCategories(prev =>
                                                            isSelected ? prev.filter(c => c !== cat.value) : [...prev, cat.value]
                                                        );
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                    )}>
                                                        <Check className={cn("h-4 w-4")} />
                                                    </div>
                                                    {cat.label}
                                                </CommandItem>
                                            );
                                        })}
                                        {/* Handle dynamic/unknown categories */}
                                        {Object.keys(groupedItems).filter(k => !CATEGORY_OPTIONS.some(o => o.value === k)).map(k => {
                                            const isSelected = selectedCategories.includes(k);
                                            return (
                                                <CommandItem key={k} onSelect={() => setSelectedCategories(prev => isSelected ? prev.filter(c => c !== k) : [...prev, k])}>
                                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                                        <Check className={cn("h-4 w-4")} />
                                                    </div>
                                                    <span className="capitalize">{k.replace('_', ' ')}</span>
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                    {isFiltered && (
                                        <CommandGroup>
                                            <CommandItem onSelect={() => setSelectedCategories([])} className="justify-center text-center">
                                                Effacer les filtres
                                            </CommandItem>
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {isFiltered && (
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCategories([])}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Grand Total Display */}
                    <Card className="flex flex-col justify-center px-3 py-1 bg-slate-50 border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Estimé</span>
                        <span className="text-sm font-bold text-emerald-600">
                            {items.reduce((sum, item) => sum + (item.allocated_cost || 0), 0).toFixed(2)} €
                        </span>
                    </Card>

                    <Button variant="outline" size="sm" onClick={() => {
                        const link = `${window.location.origin}/calendar/${event.id}/shopping`;
                        navigator.clipboard.writeText(link);
                        toast.success("Lien copié !");
                    }}>
                        Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        exportShoppingListPDF(`Liste de courses - ${event.title}`, isFiltered ? items.filter(i => selectedCategories.includes(i.category)) : items);
                    }}>
                        <FileDown className="h-4 w-4 mr-2" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* List Render */}
            {isFiltered ? (
                // Grouped View (Filtered)
                <div className="space-y-6">
                    {displayedCategories.map(category => {
                        const catItems = groupedItems[category];
                        if (!catItems || catItems.length === 0) return null;
                        const catLabel = CATEGORY_OPTIONS.find(c => c.value === category)?.label || category;

                        return (
                            <Card key={category} className="overflow-hidden">
                                <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700">{catLabel}</h3>
                                    <Badge variant="secondary" className="bg-white text-slate-500">{catItems.length}</Badge>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {catItems.map(item => (
                                        <ShoppingRow
                                            key={item.id}
                                            item={item}
                                            eventId={event.id}
                                            suppliers={suppliers}
                                            onUpdate={refreshItem}
                                            onCreateSupplier={handleCreateSupplier}
                                        />
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                // Flat View (No Filter)
                <Card className="overflow-hidden">
                    <div className="divide-y divide-slate-50">
                        {items.map(item => (
                            <ShoppingRow
                                key={item.id}
                                item={item}
                                eventId={event.id}
                                suppliers={suppliers}
                                onUpdate={refreshItem}
                                onCreateSupplier={handleCreateSupplier}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {items.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <ShoppingBasket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun ingrédient nécessaire pour le moment.</p>
                </div>
            )}
        </div>
    );
}
