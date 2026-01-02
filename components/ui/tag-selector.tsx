"use client";

import * as React from "react";
import { Check, Plus, X } from "lucide-react";
import { cn, removeAccents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type TagOption = {
    label: string;
    value: string;
};

interface TagSelectorProps {
    options: TagOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    onCreate?: (label: string) => Promise<string | void>;
    onDelete?: (value: string) => Promise<void> | void;
    className?: string;
}

export function TagSelector({
    options,
    selected,
    onChange,
    placeholder = "Rechercher ou créer...",
    onCreate,
    onDelete,
    className,
}: TagSelectorProps) {
    const [search, setSearch] = React.useState("");
    const [isCreating, setIsCreating] = React.useState(false);

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!search) return options;
        const normSearch = removeAccents(search).toLowerCase();
        return options.filter(opt =>
            removeAccents(opt.label).toLowerCase().includes(normSearch)
        );
    }, [options, search]);

    const handleToggle = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(id => id !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const handleCreate = async () => {
        if (!search || !onCreate) return;
        setIsCreating(true);
        try {
            // Check if it matches an existing option perfectly (case insensitive)
            const existing = options.find(o => o.label.toLowerCase() === search.toLowerCase());
            if (existing) {
                if (!selected.includes(existing.value)) {
                    onChange([...selected, existing.value]);
                }
                setSearch("");
                return;
            }

            const newId = await onCreate(search);
            if (newId) {
                // If the parent updates options list, we just add the ID
                onChange([...selected, newId]);
                setSearch("");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Search / Create Input */}
            <div className="relative flex gap-2">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-white"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreate();
                        }
                    }}
                />
                {search && onCreate && !options.some(o => o.label.toLowerCase() === search.toLowerCase()) && (
                    <Button
                        type="button"
                        onClick={handleCreate}
                        disabled={isCreating}
                        size="sm"
                        variant="secondary"
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Créer
                    </Button>
                )}
            </div>

            {/* Options Cloud */}
            <div className="flex flex-wrap gap-2">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                            <div key={option.value} className="relative group">
                                <Button
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleToggle(option.value)}
                                    className={cn(
                                        "h-8 rounded-full border-dashed pr-3 pl-3",
                                        isSelected
                                            ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                            : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                    )}
                                >
                                    {isSelected && <Check className="mr-1.5 h-3.5 w-3.5" />}
                                    {option.label}
                                </Button>
                                { /* Delete Button - Visible on hover of the group if provided */}
                                {onDelete && (
                                    <div
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(option.value);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-200 border border-white shadow-sm"
                                        title="Supprimer ce tag"
                                    >
                                        <X className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-sm text-slate-400 italic py-2">
                        {search ? "Aucun tag existant trouvé." : "Aucun tag disponible."}
                    </div>
                )}
            </div>
        </div>
    );
}
