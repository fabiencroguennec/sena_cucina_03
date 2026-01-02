"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, UtensilsCrossed, Carrot } from "lucide-react";
import { cn, removeAccents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";

interface UnifiedEntrySelectorProps {
    onSelectRecipe: (id: string, title: string) => void;
    onSelectIngredient: (id: string, name: string, unit: string) => void;
    restrictedAllergens?: string[];
    placeholder?: string;
}

export function UnifiedEntrySelector({
    onSelectRecipe,
    onSelectIngredient,
    restrictedAllergens = [],
    placeholder = "Ajouter une recette ou un ingrédient..."
}: UnifiedEntrySelectorProps) { // Renamed prop for clarity
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");

    const [recipes, setRecipes] = React.useState<any[]>([]);
    const [ingredients, setIngredients] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;
        if (recipes.length > 0 || ingredients.length > 0) return;

        const fetchData = async () => {
            setLoading(true);

            const [recipeRes, ingRes] = await Promise.all([
                supabase.from('recipes').select('id, title').order('title'),
                supabase.from('ingredients').select('id, name, unit').order('name')
            ]);

            if (recipeRes.data) setRecipes(recipeRes.data);
            if (ingRes.data) setIngredients(ingRes.data);
            setLoading(false);
        };

        fetchData();
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between w-full bg-white border-dashed text-slate-500 hover:text-slate-900 hover:border-solid hover:border-slate-300"
                >
                    <span className="flex items-center gap-2 truncate">
                        <Search className="h-4 w-4 shrink-0 opacity-50" />
                        {placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-2" align="start">
                <Command filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                    const normValue = removeAccents(value).toLowerCase();
                    const normSearch = removeAccents(search).toLowerCase();
                    return normValue.includes(normSearch) ? 1 : 0;
                }}>
                    <CommandInput
                        placeholder="Rechercher..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && <div className="py-6 text-center text-sm text-slate-400">Chargement...</div>}
                        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

                        {!loading && recipes.length > 0 && (
                            <CommandGroup heading="Recettes">
                                {recipes.map((recipe) => (
                                    <CommandItem
                                        key={`recipe-${recipe.id}`}
                                        value={recipe.title}
                                        onSelect={() => {
                                            onSelectRecipe(recipe.id, recipe.title);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <UtensilsCrossed className="mr-2 h-4 w-4 text-emerald-500" />
                                        <span>{recipe.title}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {!loading && recipes.length > 0 && ingredients.length > 0 && <CommandSeparator />}

                        {!loading && ingredients.length > 0 && (
                            <CommandGroup heading="Ingrédients">
                                {ingredients.map((ing) => (
                                    <CommandItem
                                        key={`ing-${ing.id}`}
                                        value={ing.name}
                                        onSelect={() => {
                                            onSelectIngredient(ing.id, ing.name, ing.unit);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Carrot className="mr-2 h-4 w-4 text-orange-500" />
                                        <span>{ing.name}</span>
                                        <span className="ml-auto text-xs text-slate-400">{ing.unit}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
