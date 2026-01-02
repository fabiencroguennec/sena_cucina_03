"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn, removeAccents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { getRecipes, Recipe } from "@/lib/api/recipes";

interface RecipeSelectorProps {
    onSelect: (recipeId: string) => void;
    restrictedAllergens?: string[];
}

export function RecipeSelector({ onSelect, restrictedAllergens }: RecipeSelectorProps) {
    const [open, setOpen] = useState(false);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && recipes.length === 0) {
            setLoading(true);
            getRecipes()
                .then((data) => {
                    // @ts-ignore
                    setRecipes(data);
                })
                .finally(() => setLoading(false));
            // In a real app we might want to paginate or search server-side
        }
    }, [open, recipes.length]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between text-slate-500 font-normal">
                    <span className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Ajouter une recette...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                    const normValue = removeAccents(value).toLowerCase();
                    const normSearch = removeAccents(search).toLowerCase();
                    return normValue.includes(normSearch) ? 1 : 0;
                }}>
                    <CommandInput placeholder="Rechercher une recette..." />
                    <CommandList>
                        <CommandEmpty>Aucune recette trouvée.</CommandEmpty>
                        <CommandGroup>
                            {recipes.map((recipe) => {
                                // Extract allergens from recipe tags
                                const recipeAllergens = recipe.recipe_tags
                                    ?.filter((t: any) => t.dietary_tags?.type === 'allergen')
                                    .map((t: any) => t.dietary_tags?.name) || [];

                                const conflicts = restrictedAllergens?.filter(a => recipeAllergens.includes(a)) || [];
                                const hasConflict = conflicts.length > 0;

                                return (
                                    <CommandItem
                                        key={recipe.id}
                                        value={recipe.title}
                                        onSelect={() => {
                                            if (hasConflict) {
                                                if (!confirm(`Attention: Cette recette contient ${conflicts.join(', ')}. Voulez-vous continuer ?`)) {
                                                    return;
                                                }
                                            }
                                            onSelect(recipe.id);
                                            setOpen(false);
                                        }}
                                        className={cn(hasConflict && "text-red-600 bg-red-50 aria-selected:bg-red-100")}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 opacity-0",
                                                // value === recipe.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{recipe.title}</span>
                                            {hasConflict && (
                                                <span className="text-[10px] font-semibold">
                                                    ⚠️ Incompatible: {conflicts.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
