"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getTags } from "@/lib/api/recipes";

interface FilterState {
    type: string[];
    theme: string[];
    time: string[]; // "<15", "<30", "<60"
    rating: string[]; // "5 étoiles", "4 étoiles et +"
}

interface FilterSheetProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    // We pass tags as props or fetch internally? Fetching internal is easier for encapsulation
}

export function FilterSheet({ filters, onFilterChange }: FilterSheetProps) {
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [themes, setThemes] = useState<{ id: string, name: string }[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        getTags('category').then((data) => setCategories(data as any || []));
        getTags('theme').then((data) => setThemes(data as any || []));
    }, []);

    const toggleFilter = (key: keyof FilterState, value: string) => {
        const current = filters[key];
        const next = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        onFilterChange({ ...filters, [key]: next });
    };

    const clearFilters = () => {
        onFilterChange({ type: [], theme: [], time: [], rating: [] });
    };

    const activeCount = filters.type.length + filters.theme.length + filters.time.length;

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
            <SheetContent className="w-[350px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-2xl font-serif">Filtres</SheetTitle>
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
                        {/* Type de plat */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Type de plat</h3>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <Badge
                                        key={cat.id}
                                        variant={filters.type.includes(cat.id) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer px-4 py-2 text-sm font-normal rounded-full transition-all hover:border-primary",
                                            filters.type.includes(cat.id) ? "hover:bg-primary/90" : "hover:bg-secondary"
                                        )}
                                        onClick={() => toggleFilter('type', cat.id)}
                                    >
                                        {cat.name}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* Temps */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Temps de préparation</h3>
                            <div className="flex flex-wrap gap-2">
                                {["< 15 min", "< 30 min", "< 60 min"].map(time => (
                                    <Badge
                                        key={time}
                                        variant={filters.time.includes(time) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer px-4 py-2 text-sm font-normal rounded-full transition-all hover:border-primary",
                                            filters.time.includes(time) ? "hover:bg-primary/90" : "hover:bg-secondary"
                                        )}
                                        onClick={() => toggleFilter('time', time)}
                                    >
                                        {time}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* Note (Rating) */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Note</h3>
                            <div className="flex flex-wrap gap-2">
                                {["5 étoiles", "4 étoiles et +", "3 étoiles et +"].map(rating => (
                                    <Badge
                                        key={rating}
                                        variant={filters.rating.includes(rating) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer px-4 py-2 text-sm font-normal rounded-full transition-all hover:border-primary",
                                            filters.rating.includes(rating) ? "hover:bg-primary/90" : "hover:bg-secondary"
                                        )}
                                        onClick={() => toggleFilter('rating', rating)}
                                    >
                                        {rating}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* Thèmes */}
                        <section>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-slate-500">Thèmes</h3>
                            <div className="flex flex-wrap gap-2">
                                {themes.map(theme => (
                                    <Badge
                                        key={theme.id}
                                        variant={filters.theme.includes(theme.id) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer px-4 py-2 text-sm font-normal rounded-full transition-all hover:border-primary",
                                            filters.theme.includes(theme.id) ? "hover:bg-primary/90" : "hover:bg-secondary"
                                        )}
                                        onClick={() => toggleFilter('theme', theme.id)}
                                    >
                                        {theme.name}
                                    </Badge>
                                ))}
                            </div>
                        </section>
                    </div>
                </ScrollArea>
                <div className="p-6 border-t bg-slate-50">
                    <Button className="w-full" onClick={() => setOpen(false)}>
                        Voir les résultats
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
