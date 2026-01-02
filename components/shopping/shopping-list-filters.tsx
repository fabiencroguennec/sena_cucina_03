
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";
import { Supplier } from "@/lib/api/suppliers";

interface ShoppingListFiltersProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    availableCategories: string[];
    selectedCategories: string[];
    onToggleCategory: (cat: string) => void;

    availableSuppliers: Supplier[];
    selectedSuppliers: string[]; // IDs
    onToggleSupplier: (id: string) => void;

    onReset: () => void;
}

export function ShoppingListFilters({
    open,
    onOpenChange,
    availableCategories,
    selectedCategories,
    onToggleCategory,
    availableSuppliers,
    selectedSuppliers,
    onToggleSupplier,
    onReset
}: ShoppingListFiltersProps) {
    const activeCount = selectedCategories.length + selectedSuppliers.length;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:w-[400px] flex flex-col p-6">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtres
                        {activeCount > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs font-normal">
                                {activeCount} actif{activeCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </SheetTitle>
                    <SheetDescription>
                        Affinez votre liste de courses par catégorie ou fournisseur.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6 py-4">
                    <div className="space-y-6">
                        {/* Categories */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-slate-900">Catégories</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {availableCategories.map(cat => (
                                    <div key={cat} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`cat-${cat}`}
                                            checked={selectedCategories.includes(cat)}
                                            onCheckedChange={() => onToggleCategory(cat)}
                                        />
                                        <Label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer py-1 flex-1">
                                            {cat}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Suppliers */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-slate-900">Fournisseurs</h4>
                            {availableSuppliers.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Aucun fournisseur assigné dans la liste actuelle.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {availableSuppliers.map(sup => (
                                        <div key={sup.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`sup-${sup.id}`}
                                                checked={selectedSuppliers.includes(sup.id)}
                                                onCheckedChange={() => onToggleSupplier(sup.id)}
                                            />
                                            <Label htmlFor={`sup-${sup.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer py-1 flex-1">
                                                {sup.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t mt-auto flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onReset} disabled={activeCount === 0}>
                        Réinitialiser
                    </Button>
                    <Button className="flex-1" onClick={() => onOpenChange(false)}>
                        Voir résultats
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
