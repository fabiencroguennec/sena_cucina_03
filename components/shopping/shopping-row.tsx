"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { ShoppingListItem } from "@/lib/types/calendar";
import { Supplier, createSupplier } from "@/lib/api/suppliers";
import { upsertShoppingListItem } from "@/lib/api/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Star, RotateCcw } from "lucide-react";
import { cn, removeAccents } from "@/lib/utils";
import { convertQuantity } from "@/lib/conversions";
import Link from "next/link";
import { toast } from "sonner";
import { debounce } from "lodash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AggregatedItem } from "@/hooks/use-shopping-list-calculation";

interface ShoppingRowProps {
    item: AggregatedItem;
    eventId: string;
    suppliers: Supplier[];
    onUpdate: (i: ShoppingListItem) => void;
    onCreateSupplier?: (name: string) => Promise<Supplier | null>;
}

export function ShoppingRow({ item, eventId, suppliers, onUpdate, onCreateSupplier }: ShoppingRowProps) {
    // Local state for inputs to avoid jumping UI
    const [price, setPrice] = useState(item.price_paid?.toString() || "");
    const [qtyBought, setQtyBought] = useState(item.quantity_bought?.toString() || "");
    const [unitBought, setUnitBought] = useState(item.unit_bought || item.unit); // Default to needed unit
    const [supplierId, setSupplierId] = useState(item.supplier_id || "");
    const [quality, setQuality] = useState(item.quality_rating || 0);
    const [isPurchased, setIsPurchased] = useState(item.is_purchased);

    // Toggle for details
    const [isOpen, setIsOpen] = useState(false);

    const itemRef = useRef(item); // Always current
    const lastItemRef = useRef(item); // For diffing

    useEffect(() => {
        itemRef.current = item;
    }, [item]);

    useEffect(() => {
        const prev = lastItemRef.current;

        if (item.price_paid !== prev.price_paid) setPrice(item.price_paid?.toString() || "");
        if (item.quantity_bought !== prev.quantity_bought) setQtyBought(item.quantity_bought?.toString() || "");
        if (item.unit_bought !== prev.unit_bought) setUnitBought(item.unit_bought || item.unit);
        if (item.supplier_id !== prev.supplier_id) setSupplierId(item.supplier_id || "");
        if (item.quality_rating !== prev.quality_rating) setQuality(item.quality_rating || 0);
        if (item.is_purchased !== prev.is_purchased) setIsPurchased(item.is_purchased);

        lastItemRef.current = item;
    }, [item]);

    const stateRef = useRef({ price, qtyBought, unitBought });
    useEffect(() => { stateRef.current = { price, qtyBought, unitBought }; }, [price, qtyBought, unitBought]);

    const buildPayloadSafe = (updates: Partial<ShoppingListItem>) => {
        const currentItem = itemRef.current;
        const { price: p, qtyBought: q, unitBought: u } = stateRef.current;

        // Use updates if present, otherwise use current state
        const effectivePrice = updates.price_paid !== undefined ? updates.price_paid : parseFloat(p || "0");
        const effectiveQty = updates.quantity_bought !== undefined ? updates.quantity_bought : parseFloat(q || "0");
        const effectiveUnit = updates.unit_bought !== undefined ? updates.unit_bought : u;
        const effectiveSupplier = updates.supplier_id !== undefined ? updates.supplier_id : supplierId;
        const effectiveQuality = updates.quality_rating !== undefined ? updates.quality_rating : quality;
        const effectivePurchased = updates.is_purchased !== undefined ? updates.is_purchased : isPurchased;

        const payload: any = {
            event_id: eventId,
            ingredient_id: currentItem.id === currentItem.shopping_list_id ? undefined : currentItem.id,
            // Explicitly set all fields to ensure consistency
            price_paid: effectivePrice,
            quantity_bought: effectiveQty,
            unit_bought: effectiveUnit,
            supplier_id: effectiveSupplier || null,
            quality_rating: effectiveQuality,
            is_purchased: effectivePurchased,
            // Merge extra updates if any (should already be covered but for safety)
            ...updates
        };

        if (currentItem.shopping_list_id) {
            payload.id = currentItem.shopping_list_id;
        } else {
            payload.quantity = currentItem.quantity;
            payload.unit = currentItem.unit;
        }

        if (effectivePrice > 0 && effectiveQty > 0) {
            payload.price_per_unit_override = effectivePrice / effectiveQty;
        } else {
            // Maybe reset override if invalid?
            // payload.price_per_unit_override = null; // Optional: clean up if needed
        }

        return payload;
    };

    // Stable Debounced Saver
    const saveChanges = useMemo(() => debounce(async (getPayload: () => any) => {
        try {
            const payload = getPayload();
            const saved = await upsertShoppingListItem(payload);
            onUpdate(saved);
        } catch (e) {
            console.error("Save failed", e);
            toast.error("Erreur sauvegarde");
        }
    }, 1000), []);

    const triggerSave = (updates: Partial<ShoppingListItem>) => {
        saveChanges(() => buildPayloadSafe(updates));
    };

    const saveImmediate = async (updates: Partial<ShoppingListItem>) => {
        try {
            saveChanges.cancel();
            const payload = buildPayloadSafe(updates);
            const saved = await upsertShoppingListItem(payload);
            onUpdate(saved);
        } catch (e) {
            console.error(e);
            toast.error("Erreur sauvegarde");
        }
    };

    const handleCheck = async (checked: boolean) => {
        setIsPurchased(checked);
        saveImmediate({ is_purchased: checked });
    };

    const handleSupplierSelect = async (supId: string) => {
        setSupplierId(supId);
        saveImmediate({ supplier_id: supId });
    };

    const handleQuality = (r: number) => {
        setQuality(r);
        saveImmediate({ quality_rating: r });
    };

    const unitOptions = Array.from(new Set(['kg', 'g', 'l', 'cl', 'ml', 'pièce', 'botte', 'boite', 'sachet', item.unit, item.unit_bought].filter(Boolean))) as string[];

    // Calculate Price Per Unit for display
    const currentPrice = Number(price);
    const currentQty = Number(qtyBought);

    // Fallback Logic:
    // If user entered a price (currentPrice > 0), calculate actual unit price (per unitBought).
    // If NOT (price is empty/0), use base_price_per_unit from item (reference price, per ingredient_unit).
    // Note: If reset, unitBought should ideally be ingredient_unit.
    const effectiveUnitPrice = (currentPrice > 0 && currentQty > 0)
        ? (currentPrice / currentQty)
        : (item.base_price_per_unit || 0);

    const isEstimated = !(currentPrice > 0);

    // Header Total Price Display
    // User Request: "Le prix a droite, dois etre le prix que cela a couté réellement en prenant compte de la quantité desiré"
    // This is exactly item.allocated_cost calculated in the hook.

    // If we have an allocated cost, use it. 
    // If not (fallback for optimistic UI), calculate it locally.
    const displayTotal = (() => {
        if (item.allocated_cost !== undefined && !isEstimated) return item.allocated_cost;

        // Optimistic / Fallback Calculation
        // We know:
        // - effectiveUnitPrice is per `unitBought` (if purchased/custom) OR per `ingredient_unit` (if estimated).
        // - item.quantity is in `item.unit`.

        let priceRefUnit = unitBought;
        if (isEstimated && item.ingredient_unit) {
            priceRefUnit = item.ingredient_unit;
        }

        const qtyNeededInRefUnit = convertQuantity(Number(item.quantity) || 0, item.unit, priceRefUnit);
        return effectiveUnitPrice * qtyNeededInRefUnit;
    })();

    // Note: Previously we showed PricePaid here if purchased. 
    // Now we show "Real Cost proportional to usage".
    // If user bought 1kg for 10€ but needs 500g, displayTotal is 5€.
    // If manually entered price is 10€ (and bought=1kg), displayTotal is 5€.
    // Wait, if user enters Price=10€, they expect to see 10€?
    // "prix que cela a couté réellement en prenant compte de la quantité desiré" implies Proportional Cost.
    // So 5€ is correct per request.

    return (
        <div className={cn(
            "group border-b last:border-0 transition-all",
            isPurchased ? 'bg-emerald-50/20' : 'hover:bg-slate-50',
            isOpen ? 'bg-slate-50' : ''
        )}>
            {/* Header / Clickable Row */}
            <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={(e) => {
                // Prevent toggle if clicking checkbox or link
                if ((e.target as HTMLElement).closest('a, button, [role="checkbox"]')) return;
                setIsOpen(!isOpen);
            }}>
                <Checkbox
                    checked={isPurchased}
                    onCheckedChange={handleCheck as any}
                    className="h-5 w-5 data-[state=checked]:bg-emerald-600 border-slate-300"
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {item.category !== 'Divers' ? (
                            <Link href={`/ingredients/${item.id}`} className={cn("font-medium truncate", isPurchased ? 'text-slate-400 line-through' : 'text-slate-900')}>
                                {item.name}
                            </Link>
                        ) : (
                            <span className={cn("font-medium truncate", isPurchased ? 'text-slate-400 line-through' : 'text-slate-900')}>
                                {item.name}
                            </span>
                        )}
                        {supplierId && (
                            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] h-5 px-1.5 text-slate-500 font-normal">
                                {suppliers.find(s => s.id === supplierId)?.name || 'Frn.'}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex gap-2 items-center">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 rounded">
                            {Number(item.quantity).toFixed(1).replace(/\.0$/, '')} {item.unit}
                        </span>
                        {effectiveUnitPrice > 0 && (
                            <span className="text-slate-400">
                                {isEstimated ? '~ ' : ''}{
                                    (() => {
                                        // Auto-normalize to standard units (kg, l) if possible
                                        const priceUnit = isEstimated ? (item.ingredient_unit || 'kg') : (unitBought || 'kg');

                                        const isMass = ['kg', 'g', 'mg', 'cac', 'cas'].includes(priceUnit); // treat cac/cas as mass-ish/fluid
                                        const isVol = ['l', 'cl', 'ml'].includes(priceUnit);

                                        // Default target: mass->kg, volume->l, else itself
                                        const targetUnit = isVol ? 'l' : (isMass ? 'kg' : priceUnit);

                                        // Factor: How many "priceUnit" are in 1 "targetUnit"?
                                        // Example: target=kg, source=g. 1kg = 1000g. Factor = 1000.
                                        // Price/g * 1000 = Price/kg.
                                        const factor = convertQuantity(1, targetUnit, priceUnit);

                                        const normalizedPrice = effectiveUnitPrice * factor;

                                        return `${normalizedPrice.toFixed(2)}€/${targetUnit}`;
                                    })()
                                }
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Collapsed Price View */}
                    {displayTotal > 0 && (
                        <div className={cn("text-sm font-semibold mr-2", isEstimated ? "text-slate-400 italic" : "text-slate-700")}>
                            {displayTotal.toFixed(2)} €
                        </div>
                    )}
                    <ChevronsUpDown className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                </div>
            </div>

            {/* Expandable Details */}
            {isOpen && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Supplier */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Fournisseur</label>
                                <div className="w-full">
                                    <SupplierCombobox
                                        value={supplierId}
                                        suppliers={suppliers}
                                        onSelect={handleSupplierSelect}
                                        onCreate={onCreateSupplier || (async () => null)}
                                    />
                                </div>
                            </div>

                            {/* Quality */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Qualité</label>
                                <div className="flex items-center gap-1 h-8">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleQuality(star)}
                                            className="focus:outline-none p-0.5 hover:scale-110 transition-transform"
                                        >
                                            <Star
                                                className={cn(
                                                    "h-5 w-5 transition-colors",
                                                    star <= quality ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-200"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                            {/* Quantity Bought */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Acheté</label>
                                <div className="flex items-center gap-1">
                                    <Input
                                        className="h-8 text-sm"
                                        placeholder="Qté"
                                        type="number"
                                        value={qtyBought}
                                        onChange={e => {
                                            setQtyBought(e.target.value);
                                            triggerSave({ quantity_bought: parseFloat(e.target.value) });
                                        }}
                                    />
                                    <Select value={unitBought} onValueChange={(val) => {
                                        setUnitBought(val);
                                        saveImmediate({ unit_bought: val });
                                    }}>
                                        <SelectTrigger className="h-8 w-[70px] text-xs px-2">
                                            <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {unitOptions.map(u => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Price Paid */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Prix Total</label>
                                    {(Number(price) > 0 || supplierId) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1.5 text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("Réinitialiser les données d'achat pour cet ingrédient ?")) {
                                                    const resetUnit = item.ingredient_unit || item.unit;
                                                    setPrice("");
                                                    setQtyBought("");
                                                    setUnitBought(resetUnit);
                                                    setSupplierId("");
                                                    setQuality(0);
                                                    setIsPurchased(false);

                                                    saveImmediate({
                                                        price_paid: 0,
                                                        quantity_bought: 0,
                                                        unit_bought: resetUnit,
                                                        supplier_id: null,
                                                        quality_rating: 0,
                                                        is_purchased: false,
                                                        price_per_unit_override: null
                                                    } as any);
                                                }
                                            }}
                                            title="Réinitialiser au prix de référence"
                                        >
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                            Reset
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <span className="absolute left-2 top-2 text-xs text-slate-400">€</span>
                                        <Input
                                            className="h-8 pl-6 text-sm font-semibold"
                                            placeholder="0.00"
                                            type="number"
                                            step="0.01"
                                            value={price}
                                            onChange={e => {
                                                setPrice(e.target.value);
                                                triggerSave({ price_paid: parseFloat(e.target.value) });
                                            }}
                                        />
                                    </div>
                                    <div className="px-1">
                                        <Slider
                                            defaultValue={[0]}
                                            value={[
                                                // Logarithmic inverse: Slider = 100 * log(Price + 1) / log(1001)
                                                // If price > 1000, max out at 100
                                                Math.min(100, Math.max(0, (Math.log((Number(price || 0)) + 1) / Math.log(1001)) * 100))
                                            ]}
                                            max={100}
                                            step={0.1}
                                            onValueChange={(vals: number[]) => {
                                                const sliderVal = vals[0];
                                                // Logarithmic: Price = 1001^(Slider/100) - 1
                                                // This gives ~30€ at 50%, ~177€ at 75%, 1000€ at 100%
                                                const logPrice = Math.pow(1001, sliderVal / 100) - 1;

                                                // Round nicely based on value magnitude for cleaner UX
                                                let finalPrice = logPrice;
                                                if (finalPrice < 10) finalPrice = Math.round(finalPrice * 100) / 100; // 0.01 precision
                                                else if (finalPrice < 100) finalPrice = Math.round(finalPrice * 10) / 10; // 0.1 precision
                                                else finalPrice = Math.round(finalPrice); // 1.0 precision

                                                setPrice(finalPrice.toString());
                                                triggerSave({ price_paid: finalPrice });
                                            }}
                                            className="py-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function SupplierCombobox({ value, suppliers, onSelect, onCreate }: { value: string, suppliers: Supplier[], onSelect: (id: string) => void, onCreate: (name: string) => Promise<any> }) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Find selected name
    const selectedName = suppliers.find(s => s.id === value)?.name;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[140px] sm:w-[160px] h-8 justify-between text-xs px-2"
                >
                    <span className="truncate">{selectedName || "Fournisseur..."}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                    const normValue = removeAccents(value).toLowerCase();
                    const normSearch = removeAccents(search).toLowerCase();
                    return normValue.includes(normSearch) ? 1 : 0;
                }}>
                    <CommandInput placeholder="Rechercher..." value={inputValue} onValueChange={setInputValue} />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-xs text-center">
                                <p className="mb-2">Pas trouvé.</p>
                                <Button size="sm" variant="secondary" className="w-full h-7 text-xs" onClick={async () => {
                                    const newS = await onCreate(inputValue);
                                    if (newS) {
                                        onSelect(newS.id);
                                        setOpen(false);
                                    }
                                }}>
                                    Créer "{inputValue}"
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {suppliers.map((sup) => (
                                <CommandItem
                                    key={sup.id}
                                    value={sup.name}
                                    onSelect={() => {
                                        onSelect(sup.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === sup.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {sup.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
