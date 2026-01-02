"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getTags } from "@/lib/api/recipes";
import { getSuppliers, Supplier } from "@/lib/api/suppliers";
import { Slider } from "@/components/ui/slider";
import { CATEGORY_OPTIONS } from "@/lib/validators/ingredient";
import { MultiSelect } from "@/components/ui/multi-select";
import { getIconForCategory } from "@/lib/ui-utils";

export interface IngredientFiltersState {
    categories: string[];
    allergens: string[];
    diets: string[]; // Incompatible diets
    suppliers: string[];
    priceRange: [number, number]; // [min, max]
}

export const INITIAL_FILTERS: IngredientFiltersState = {
    categories: [],
    allergens: [],
    diets: [],
    suppliers: [],
    priceRange: [0, 100] // Default range, will be updated based on max price
};

interface IngredientFilterSheetProps {
    filters: IngredientFiltersState;
    onFilterChange: (filters: IngredientFiltersState) => void;
    maxPrice?: number;
}

export function IngredientFilterSheet({ filters, onFilterChange, maxPrice = 100 }: IngredientFilterSheetProps) {
    const [allergens, setAllergens] = useState<{ id: string, name: string }[]>([]);
    const [diets, setDiets] = useState<{ id: string, name: string }[]>([]);
    const [suppliers, setSuppliers] = useState<{ label: string, value: string }[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        getTags('allergen').then((data) => setAllergens(data as any || []));
        getTags('diet').then((data) => setDiets(data as any || []));
        getSuppliers().then(data => setSuppliers(data.map(s => ({ label: s.name, value: s.id }))));
    }, []);

    const toggleFilter = (key: keyof IngredientFiltersState, value: string) => {
        const current = filters[key] as string[];
        const next = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        onFilterChange({ ...filters, [key]: next });
    };

    const handlePriceChange = (value: number[]) => {
        onFilterChange({ ...filters, priceRange: [value[0], value[1]] });
    };

    const clearFilters = () => {
        onFilterChange(INITIAL_FILTERS);
    };

    const activeCount =
        filters.categories.length +
        filters.allergens.length +
        filters.diets.length +
        filters.suppliers.length +
        (filters.priceRange[0] !== 0 || filters.priceRange[1] !== maxPrice ? 1 : 0);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                    <Filter className="h-4 w-4" />
                    Filtres
                    {activeCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                            {activeCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[540px] flex flex-col p-0" side="right">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-2xl font-serif">Filtres Ingrédients</SheetTitle>
                        {activeCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive">
                                Tout effacer
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                <Separator />
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8">

                        {/* Prix Range */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-sm uppercase tracking-wider text-slate-500">Prix Interactif (€)</h3>
                                <span className="text-sm font-medium text-slate-900">
                                    {filters.priceRange[0]}€ - {filters.priceRange[1]}€
                                </span>
                            </div>
                            <Slider
                                defaultValue={[0, maxPrice]}
                                value={[filters.priceRange[0], filters.priceRange[1]]}
                                max={maxPrice}
                                step={1}
                                minStepsBetweenThumbs={1}
                                onValueChange={handlePriceChange}
                                className="my-6"
                            />
                        </section>

                        {/* Catégories */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Catégories</h3>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_OPTIONS.map(cat => {
                                    const Icon = getIconForCategory(cat.value);
                                    return (
                                        <Badge
                                            key={cat.value}
                                            variant={filters.categories.includes(cat.value) ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer px-3 py-1.5 text-sm font-normal rounded-full transition-all hover:border-primary flex items-center gap-2",
                                                filters.categories.includes(cat.value) ? "hover:bg-primary/90" : "hover:bg-secondary"
                                            )}
                                            onClick={() => toggleFilter('categories', cat.value)}
                                        >
                                            {Icon && <Icon className="h-4 w-4" />}
                                            {cat.label}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Fournisseurs */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Fournisseurs</h3>
                            <MultiSelect
                                options={suppliers}
                                selected={filters.suppliers}
                                onChange={(vals) => onFilterChange({ ...filters, suppliers: vals })}
                                placeholder="Rechercher des fournisseurs..."
                                className="w-full"
                            />
                        </section>


                        {/* Allergènes */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Allergènes</h3>
                            <MultiSelect
                                options={allergens.map(a => ({ label: a.name, value: a.id }))}
                                selected={filters.allergens}
                                onChange={(vals) => onFilterChange({ ...filters, allergens: vals })}
                                placeholder="Filtrer par allergènes"
                            />
                        </section>

                        {/* Régimes Incompatibles */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Incompatible avec Régimes</h3>
                            <MultiSelect
                                options={diets.map(d => ({ label: d.name, value: d.id }))}
                                selected={filters.diets}
                                onChange={(vals) => onFilterChange({ ...filters, diets: vals })}
                                placeholder="Filtrer par régimes"
                            />
                        </section>

                    </div>
                </ScrollArea>

            </SheetContent>
        </Sheet>
    );
}
