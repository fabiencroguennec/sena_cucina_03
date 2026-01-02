"use client";

import { useEffect, useState, useMemo } from "react";
import { getIngredients, Ingredient, deleteIngredient } from "@/lib/api/ingredients";
import { getTags } from "@/lib/api/recipes";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Image as ImageIcon, Search, Info, Star, ChevronDown, ChevronUp, ArrowUpDown, Plus, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IngredientForm } from "./ingredient-form";
import { IngredientPriceHistory } from "./ingredient-price-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIconForTag, getIconForCategory } from "@/lib/ui-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, removeAccents } from "@/lib/utils";
import { IngredientFilterSheet, IngredientFiltersState, INITIAL_FILTERS } from "./ingredient-filters";
import { CATEGORY_OPTIONS } from "@/lib/validators/ingredient";
import { useAssistantMode } from "@/components/assistant-context";

type SortKey = 'name' | 'category' | 'supplier' | 'price_per_unit';
type SortDir = 'asc' | 'desc';

interface IngredientsListProps {
    isCreating: boolean;
    onToggleCreating: (isOpen: boolean) => void;
}

export function IngredientsList({ isCreating, onToggleCreating }: IngredientsListProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [dietMap, setDietMap] = useState<Record<string, string>>({});

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<IngredientFiltersState>(INITIAL_FILTERS);

    // Dynamic max price
    const maxPrice = useMemo(() => {
        if (ingredients.length === 0) return 100;
        return Math.ceil(Math.max(...ingredients.map(i => i.price_per_unit || 0)) / 10) * 10; // Round to next 10
    }, [ingredients]);

    useEffect(() => {
        setFilters(prev => ({ ...prev, priceRange: [0, maxPrice] }));
    }, [maxPrice]);

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // State
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { isAssistantMode } = useAssistantMode();

    const fetchIngredients = async () => {
        setLoading(true);
        try {
            const data = await getIngredients();
            setIngredients(data);

            // Fetch diets for mapping
            const diets = await getTags('diet');
            if (diets) {
                const map: Record<string, string> = {};
                diets.forEach((d: any) => map[d.id] = d.name);
                setDietMap(map);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement des ingrédients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIngredients();
    }, []);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const toggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            onToggleCreating(false); // Close create form if opening an edit
        }
    };

    // Use prop for closing
    const handleCancelCreate = () => {
        onToggleCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) return;
        try {
            await deleteIngredient(id);
            toast.success("Ingrédient supprimé");
            fetchIngredients();
        } catch (e) {
            toast.error("Impossible de supprimer cet ingrédient");
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...ingredients];

        // Filter
        if (searchTerm) {
            const lowerInfo = removeAccents(searchTerm).toLowerCase();
            result = result.filter(i =>
                removeAccents(i.name).toLowerCase().includes(lowerInfo) ||
                (i.supplier && removeAccents(i.supplier).toLowerCase().includes(lowerInfo))
            );
        }
        if (filters.categories.length > 0) {
            result = result.filter(i => i.category && filters.categories.includes(i.category));
        }

        if (filters.allergens.length > 0) {
            result = result.filter(i =>
                i.ingredient_tags?.some(tag =>
                    tag.dietary_tags?.type === 'allergen' && filters.allergens.includes(tag.tag_id)
                )
            );
        }

        if (filters.diets.length > 0) {
            result = result.filter(i =>
                i.incompatible_diets?.some(dId => filters.diets.includes(dId))
            );
        }

        if (filters.suppliers.length > 0) {
            result = result.filter(i =>
                i.ingredient_suppliers?.some(s => filters.suppliers.includes(s.supplier_id))
            );
        }

        // Price Range
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) {
            result = result.filter(i =>
                (i.price_per_unit || 0) >= filters.priceRange[0] &&
                (i.price_per_unit || 0) <= filters.priceRange[1]
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA: any = a[sortKey];
            let valB: any = b[sortKey];

            // Handle nested/special cases
            if (sortKey === 'supplier') {
                valA = a.ingredient_suppliers?.[0]?.supplier?.name || a.supplier || '';
                valB = b.ingredient_suppliers?.[0]?.supplier?.name || b.supplier || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [ingredients, searchTerm, filters, sortKey, sortDir, maxPrice]);

    // Headers config for the "Table" part
    const headers: { label: string; key?: SortKey; className?: string }[] = [
        { label: "", className: "w-[60px] shrink-0" },
        { label: "Nom", key: 'name', className: "flex-1" },
        { label: "Catégorie", key: 'category', className: "w-[120px] hidden md:block shrink-0" },
        { label: "Allergènes", className: "w-[100px] hidden md:block shrink-0 text-center" },
        { label: "Régimes", className: "w-[150px] hidden md:block shrink-0 text-center" },
        { label: "Prix / Unité", key: 'price_per_unit', className: "w-[100px] text-right shrink-0" },
        { label: "", className: "w-[40px] shrink-0" }, // Expand arrow
    ];

    const uniqueCategories = Array.from(new Set(ingredients.map(i => i.category).filter(Boolean)));

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Actions & Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 shadow-sm flex-wrap">
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                        </div>
                        <IngredientFilterSheet
                            filters={filters}
                            onFilterChange={setFilters}
                            maxPrice={maxPrice}
                        />
                        <div className="flex items-center px-4 text-sm text-slate-500 font-medium">
                            {filteredAndSorted.length} résultat{filteredAndSorted.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Table Header (Desktop-ish representation) */}
                <div className="hidden md:flex px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-t-lg border-b dark:border-slate-800 text-sm font-medium text-slate-500">
                    {headers.map((h, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center gap-1 cursor-pointer select-none",
                                h.className?.includes("text-center") ? "justify-center" : "",
                                h.className,
                                h.key && "hover:text-slate-900"
                            )}
                            onClick={() => h.key && handleSort(h.key)}
                        >
                            {h.label}
                            {h.key && sortKey === h.key && (
                                <ArrowUpDown className={cn("h-3 w-3", sortDir === 'asc' ? "rotate-0" : "rotate-180")} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    {/* NEW ITEM FORM */}
                    {isCreating && isAssistantMode ? (
                        <IngredientForm
                            onSuccess={() => {
                                fetchIngredients();
                                onToggleCreating(false);
                            }}
                            onCancel={handleCancelCreate}
                        />
                    ) : (
                        <Dialog open={isCreating} onOpenChange={(open) => !open && handleCancelCreate()}>
                            <DialogContent className="sm:max-w-lg w-full h-[100dvh] sm:h-auto p-0 sm:p-6 border-none sm:border rounded-none sm:rounded-lg overflow-hidden sm:overflow-visible flex flex-col sm:block [&>button]:hidden sm:[&>button]:block" onInteractOutside={(e) => e.preventDefault()}>
                                <DialogTitle className="sr-only">Nouveau Produit</DialogTitle>
                                <div className="flex-1 min-h-0 sm:h-auto overflow-y-auto">
                                    <IngredientForm
                                        onSuccess={() => {
                                            fetchIngredients();
                                            onToggleCreating(false);
                                        }}
                                        onCancel={handleCancelCreate}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    {loading ? (
                        <div className="text-center p-8 text-slate-500">Chargement...</div>
                    ) : filteredAndSorted.length === 0 && !isCreating ? (
                        <div className="text-center p-8 text-slate-500 border rounded-lg bg-white dark:bg-slate-900">Aucun ingrédient trouvé.</div>
                    ) : (
                        filteredAndSorted.map((ing) => {
                            const isExpanded = expandedId === ing.id;
                            return (
                                <div key={ing.id} className={cn(
                                    "bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg overflow-hidden transition-all shadow-sm",
                                    isExpanded ? "ring-2 ring-primary/20 shadow-md" : "hover:border-slate-300 dark:hover:border-slate-700"
                                )}>
                                    {/* Summary Row */}
                                    <div
                                        className="flex flex-col md:flex-row md:items-center p-3 gap-3 cursor-pointer"
                                        onClick={() => toggleExpand(ing.id)}
                                    >
                                        {/* Mobile Header: Icon + Name + Price */}
                                        <div className="flex items-center justify-between md:hidden">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                                    {(() => {
                                                        const Icon = getIconForCategory(ing.category || '');
                                                        return Icon ? <Icon className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />;
                                                    })()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{ing.name}</div>
                                                    <div className="text-xs text-slate-500">{ing.price_per_unit} € / {ing.unit}</div>
                                                </div>
                                            </div>
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                        </div>

                                        {/* Desktop Columns */}
                                        <div className="hidden md:block w-[60px] shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                {(() => {
                                                    const Icon = getIconForCategory(ing.category || '');
                                                    return Icon ? <Icon className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="hidden md:block flex-1 font-medium text-slate-900 dark:text-slate-100">{ing.name}</div>
                                        <div className="hidden md:block w-[120px] shrink-0 text-slate-500 capitalize">
                                            {(() => {
                                                const catVal = ing.category;
                                                const catOption = CATEGORY_OPTIONS.find(c => c.value === catVal);
                                                const Icon = catVal ? getIconForCategory(catVal) : null;
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
                                                        <span className="truncate" title={catOption?.label || catVal || ''}>
                                                            {catOption?.label || catVal?.replace('_', ' ') || '-'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="hidden md:block w-[100px] shrink-0">
                                            <div className="flex gap-1 flex-wrap justify-center">
                                                {ing.ingredient_tags?.map(t => {
                                                    if (!t.dietary_tags) return null;
                                                    const Icon = getIconForTag(t.dietary_tags.name, t.dietary_tags.type as 'allergen' | 'diet');
                                                    if (!Icon) return null;
                                                    return (
                                                        <Tooltip key={t.tag_id}>
                                                            <TooltipTrigger asChild>
                                                                <div className={`p-0.5 rounded-full ${t.dietary_tags.type === 'allergen' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                    <Icon className="h-3 w-3" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p className="text-xs">{t.dietary_tags.name}</p></TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="hidden md:block w-[150px] shrink-0">
                                            <div className="flex gap-1 flex-wrap justify-center">
                                                {ing.incompatible_diets?.map(dietId => {
                                                    const dietName = dietMap[dietId] || dietId;
                                                    const Icon = getIconForTag(dietName, 'diet');
                                                    if (!Icon) return null;
                                                    return (
                                                        <Tooltip key={dietId}>
                                                            <TooltipTrigger asChild>
                                                                <div className="p-0.5 rounded-full bg-red-50 text-red-500">
                                                                    <Icon className="h-3 w-3" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p className="text-xs">Incompatible {dietName}</p></TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}
                                                {(!ing.incompatible_diets || ing.incompatible_diets.length === 0) && (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="hidden md:block w-[100px] shrink-0 text-right font-medium">
                                            {ing.price_per_unit} € <span className="text-slate-400 font-normal">/ {ing.unit}</span>
                                        </div>
                                        <div className="hidden md:flex w-[80px] shrink-0 justify-end items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(ing.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 pb-0">
                                            <div className="flex justify-end mb-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 h-8 px-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(ing.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">Supprimer le produit</span>
                                                </Button>
                                            </div>

                                            <IngredientForm
                                                initialData={ing}
                                                onSuccess={() => {
                                                    fetchIngredients();
                                                }}
                                                onCancel={() => toggleExpand(ing.id)}
                                                priceHistoryNode={
                                                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                                                        <CardHeader className="px-4 pt-2 pb-0">
                                                            <CardTitle className="text-lg font-serif text-slate-800 flex items-center gap-2">
                                                                <History className="h-5 w-5 text-emerald-600" />
                                                                Historique Prix & Qualité
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="p-4 pt-0">
                                                            <IngredientPriceHistory ingredientId={ing.id} />
                                                        </CardContent>
                                                    </Card>
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
