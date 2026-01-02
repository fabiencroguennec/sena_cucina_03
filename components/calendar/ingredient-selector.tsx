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
import { getIngredients, Ingredient } from "@/lib/api/ingredients";

interface IngredientSelectorProps {
    onSelect: (ingredientId: string, name: string, unit: string) => void;
}

export function IngredientSelector({ onSelect }: IngredientSelectorProps) {
    const [open, setOpen] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && ingredients.length === 0) {
            setLoading(true);
            getIngredients()
                .then((data) => {
                    setIngredients(data);
                })
                .finally(() => setLoading(false));
        }
    }, [open, ingredients.length]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between text-slate-500 font-normal">
                    <span className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Ajouter un ingrédient...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command filter={(value, search) => {
                    if (value.includes(search)) return 1;
                    const normValue = removeAccents(value).toLowerCase();
                    const normSearch = removeAccents(search).toLowerCase();
                    return normValue.includes(normSearch) ? 1 : 0;
                }}>
                    <CommandInput placeholder="Rechercher un ingrédient..." />
                    <CommandList>
                        <CommandEmpty>Aucun ingrédient trouvé.</CommandEmpty>
                        <CommandGroup>
                            {ingredients.map((ing) => (
                                <CommandItem
                                    key={ing.id}
                                    value={ing.name}
                                    onSelect={() => {
                                        onSelect(ing.id, ing.name, ing.unit);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{ing.name}</span>
                                        <span className="text-[10px] text-slate-400">{ing.category} - {ing.unit}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
