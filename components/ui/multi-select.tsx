"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type MultiOption = {
    label: string
    value: string
}

interface MultiSelectProps {
    options: MultiOption[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    onCreate?: (label: string) => Promise<string> | void
    className?: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Sélectionner...",
    onCreate,
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const selectedOptions = React.useMemo(() => {
        return selected.map(id => options.find(opt => opt.value === id) || { label: id, value: id })
    }, [selected, options]);

    const toggleSelection = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((item) => item !== value))
        } else {
            onChange([...selected, value])
        }
    }

    const handleCreate = async () => {
        if (onCreate && search) {
            // Optimistic or waiting? Let's just create.
            // The parent component should handle updating the 'selected' list and 'options' list.
            try {
                const newValue = await onCreate(search)
                if (newValue) {
                    // Assume onCreate returns the ID
                    onChange([...selected, newValue]);
                    setSearch("");
                    setOpen(false); // Close or keep open?
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto min-h-10 py-2 hover:bg-transparent", className)}
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedOptions.length > 0 ? (
                            selectedOptions.map((item) => (
                                <Badge
                                    variant="secondary"
                                    key={item.value}
                                    className="mr-1 mb-1"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleSelection(item.value)
                                    }}
                                >
                                    {item.label}
                                    <X className="ml-1 h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground font-normal">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Rechercher ou créer..." value={search} onValueChange={setSearch} />
                    <CommandList className="max-h-[200px] md:max-h-[300px] overflow-y-auto pointer-events-auto">
                        <CommandEmpty>
                            {onCreate && search ? (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm h-8"
                                    onClick={handleCreate}
                                >
                                    Créer &quot;{search}&quot;
                                </Button>
                            ) : (
                                "Aucun résultat."
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Search by label
                                    onSelect={() => {
                                        // currentValue is lowercased label by default in cmdk, but we want the ID.
                                        // However, we rely on click handler toggleSelection with option.value
                                        toggleSelection(option.value)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
