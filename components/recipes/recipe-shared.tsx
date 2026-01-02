"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, GripVertical, Check, ChevronsUpDown } from "lucide-react";
import { cn, removeAccents } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState } from "react";
import { UNIT_OPTIONS } from "@/lib/validators/ingredient";
import { Ingredient } from "@/lib/api/ingredients";

// Re-export specific imports if needed or just use them here.
// Actually, SortableItem depends on @dnd-kit.

export const getStepForUnit = (unit: string) => {
    switch (unit) {
        case "kg":
        case "l":
            return "0.1"; // 100g / 100ml increments often used for bulk
        case "g":
        case "ml":
            return "10"; // 10g / 10ml increments
        case "cl":
            return "1";
        case "pcs":
        case "bot":
        case "box":
        case "cac":
        case "cas":
            return "1";
        default:
            return "1"; // Default step
    }
};

export const getCompatibleUnits = (baseUnit: string) => {
    // Weight units
    if (['kg', 'g', 'mg'].includes(baseUnit)) {
        return UNIT_OPTIONS.filter(u => ['kg', 'g'].includes(u.value));
    }
    // Volume units
    if (['l', 'cl', 'ml', 'cac', 'cas'].includes(baseUnit)) {
        return UNIT_OPTIONS.filter(u => ['l', 'cl', 'ml', 'cac', 'cas'].includes(u.value));
    }
    // Default: allow only the base unit itself if no conversion group matches
    return UNIT_OPTIONS.filter(u => u.value === baseUnit);
};

export const TimeStepper = ({ value, onChange, icon: Icon, label }: { value: number, onChange: (val: number) => void, icon: any, label?: string }) => {
    const formatTime = (minutes: number) => {
        if (minutes === 0) return "0 min";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m} min`;
    };

    return (
        <div className="flex items-center justify-between gap-1 select-none group w-full bg-white rounded-lg p-1 border border-slate-200 shadow-sm hover:border-amber-200 transition-all">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-amber-600 disabled:opacity-30 flex-none"
                onClick={() => onChange(Math.max(0, value - 5))}
                disabled={value <= 0}
            >
                <Minus className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center gap-2 flex-1">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span className={cn("font-bold text-sm tabular-nums text-center", value === 0 ? "text-slate-300" : "text-slate-700")}>
                    {formatTime(value)}
                </span>
                {label && <span className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 hidden sm:inline-block">{label}</span>}
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-amber-600 flex-none"
                onClick={() => onChange(value + 5)}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
};

export const IngredientSelector = ({ value, onChange, ingredients }: { value: string, onChange: (val: string) => void, ingredients: Ingredient[] }) => {
    const [open, setOpen] = useState(false);
    const selected = ingredients.find((i) => i.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-sm bg-white border-slate-200 h-9 hover:bg-slate-50 hover:text-slate-900"
                >
                    <span className="truncate">{selected ? selected.name : "Ingrédient..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                    const normValue = removeAccents(value).toLowerCase();
                    const normSearch = removeAccents(search).toLowerCase();
                    return normValue.includes(normSearch) ? 1 : 0;
                }}>
                    <CommandInput placeholder="Rechercher..." />
                    <CommandList>
                        <CommandEmpty>Aucun résultat.</CommandEmpty>
                        <CommandGroup>
                            {ingredients.map((ing) => (
                                <CommandItem
                                    key={ing.id}
                                    value={ing.name}
                                    onSelect={() => {
                                        onChange(ing.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === ing.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {ing.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
