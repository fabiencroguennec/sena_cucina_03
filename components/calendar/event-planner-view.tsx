"use client";

import { useEffect, useState, useMemo } from "react";
import { getEventById, getEventMeals, deleteEvent, updateEvent, updateEventMealsServings } from "@/lib/api/calendar";
import { Event, EventMeal } from "@/lib/types/calendar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, CalendarDays, Loader2, Trash2, Edit, User, Mail, Phone,
    MapPin, Euro, Calendar, Users, ShoppingBasket, ExternalLink, Play,
    Wheat, Milk, Egg, Nut, Fish, Bean, Leaf, Sprout, WheatOff, MilkOff, Shell, CircleAlert
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventPlanningTab } from "@/components/calendar/event-planning-tab";
import { EventForm } from "@/components/calendar/event-form";
import { EventShoppingTab } from "@/components/calendar/event-shopping-tab";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getConvertedCost } from "@/lib/pricing";
import { convertQuantity } from "@/lib/conversions";
import { getTags, DietaryTag } from "@/lib/api/recipes";
import { useRouter } from "next/navigation";
import { useAssistantMode } from "@/components/assistant-context";
import { EventWizard } from "@/components/calendar/event-wizard";

const getIconForTag = (name: string, type: string) => {
    const lowerName = name.toLowerCase();
    if (type === 'diet') {
        if (lowerName.includes('végétarien')) return <Leaf className="h-3.5 w-3.5" />;
        if (lowerName.includes('vegan')) return <Sprout className="h-3.5 w-3.5" />;
        if (lowerName.includes('sans gluten')) return <WheatOff className="h-3.5 w-3.5" />;
        if (lowerName.includes('sans lactose')) return <MilkOff className="h-3.5 w-3.5" />;
    }
    // Allergens
    if (lowerName.includes('gluten')) return <Wheat className="h-3.5 w-3.5 text-orange-500" />;
    if (lowerName.includes('lait')) return <Milk className="h-3.5 w-3.5 text-orange-500" />;
    if (lowerName.includes('œuf') || lowerName.includes('oeuf')) return <Egg className="h-3.5 w-3.5 text-orange-500" />;
    if (lowerName.includes('fruit à coque') || lowerName.includes('arachide') || lowerName.includes('noix')) return <Nut className="h-3.5 w-3.5 text-orange-500" />;
    if (lowerName.includes('poisson')) return <Fish className="h-3.5 w-3.5 text-orange-500" />;
    if (lowerName.includes('crustacé') || lowerName.includes('mollusque')) return <Shell className="h-3.5 w-3.5 text-orange-500" />;
    if (lowerName.includes('soja')) return <Bean className="h-3.5 w-3.5 text-orange-500" />;

    // Default based on type
    if (type === 'diet') return <Leaf className="h-3.5 w-3.5" />;
    return <CircleAlert className="h-3.5 w-3.5 text-orange-500" />;
};

interface EventPlannerViewProps {
    eventId: string;
    onBack?: () => void;
}

export function EventPlannerView({ eventId, onBack }: EventPlannerViewProps) {
    const router = useRouter();
    const id = eventId;

    const [event, setEvent] = useState<Event | null>(null);
    const [meals, setMeals] = useState<EventMeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const { isAssistantMode } = useAssistantMode();

    // Financial State
    const [margin, setMargin] = useState<number>(70);
    const [allDiets, setAllDiets] = useState<DietaryTag[]>([]);

    useEffect(() => {
        getTags('diet').then(setAllDiets);
        if (id) {
            setLoading(true);
            Promise.all([
                getEventById(id),
                getEventMeals(id)
            ]).then(([eventData, mealsData]) => {
                setEvent(eventData);
                setMeals(mealsData);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                toast.error("Erreur de chargement");
                setLoading(false);
            });
        }
    }, [id]);

    const financialMetrics = useMemo(() => {
        if (!event || !meals.length) return {
            totalCost: 0,
            totalWeightGrams: 0
        };

        let totalCost = 0;
        let totalWeightGrams = 0;

        meals.forEach(meal => {
            // @ts-ignore
            const recipe = meal.recipes;
            if (!recipe || !recipe.recipe_items) return;

            // Calculate scaling ratio for this meal
            let ratio = 1;

            if (meal.target_servings_small && meal.target_servings_small > 0) {
                // Small Plate Ratio
                // @ts-ignore
                const baseSmall = recipe.base_servings_small || Math.ceil((recipe.base_servings || 1) * 1.5) || 1;
                ratio = meal.target_servings_small / baseSmall;
            } else if (meal.target_servings_large && meal.target_servings_large > 0) {
                // Large Plate Ratio
                ratio = meal.target_servings_large / (recipe.base_servings || 1);
            } else {
                // Legacy/Default Fallback
                const count = meal.target_servings || event.guest_count || 10;
                ratio = count / (recipe.base_servings || 1);
            }

            // Sum up items
            recipe.recipe_items.forEach((item: any) => {
                const qty = (item.quantity_needed || 0) * ratio;

                // Cost
                totalCost += getConvertedCost(
                    item.ingredients?.price_per_unit || 0,
                    item.ingredients?.unit || 'kg',
                    qty,
                    item.unit
                );

                // Weight
                if (['kg', 'g', 'l', 'cl', 'ml'].includes(item.unit)) {
                    totalWeightGrams += convertQuantity(qty, item.unit, 'g');
                }
            });

            // 2. Direct Ingredients (Fixed Quantity, not scaled)
            if (meal.meal_ingredients) {
                meal.meal_ingredients.forEach((mi: any) => {
                    if (!mi.ingredients) return;
                    const qty = mi.quantity || 0;

                    // Cost
                    totalCost += getConvertedCost(
                        mi.ingredients.price_per_unit || 0,
                        mi.ingredients.unit || 'kg',
                        qty,
                        mi.unit
                    );

                    // Weight
                    if (['kg', 'g', 'l', 'cl', 'ml'].includes(mi.unit)) {
                        totalWeightGrams += convertQuantity(qty, mi.unit, 'g');
                    }
                });
            }
        });

        return { totalCost, totalWeightGrams };
    }, [meals, event]);

    const derivedMetrics = useMemo(() => {
        const guestCount = event?.guest_count || 1;
        const totalCost = financialMetrics.totalCost;

        const marginDecimal = margin / 100;
        const sellingPriceTotal = marginDecimal >= 1 ? 0 : totalCost / (1 - marginDecimal);
        const profitTotal = sellingPriceTotal - totalCost;

        return {
            totalCost,
            sellingPriceTotal,
            profitTotal,
            weightPerServing: financialMetrics.totalWeightGrams / guestCount,
            costPerServing: totalCost / guestCount,
            sellingPricePerServing: sellingPriceTotal / guestCount,
            profitPerServing: profitTotal / guestCount
        }
    }, [financialMetrics, margin, event?.guest_count]);

    // Allergens & Diets Analysis

    const analysis = useMemo(() => {
        const allergens = new Set<string>();

        if (!meals.length) return { allergens: [], compatibleDiets: [] };

        // Robust extraction
        const allTags = meals.flatMap(m =>
            // @ts-ignore
            (m.recipes?.recipe_tags || []).map((rt: any) => rt.dietary_tags)
        ).filter(tag => tag !== null && tag !== undefined);

        // Collect Allergens
        allTags.forEach((tag: any) => {
            if (tag.type && tag.type.toLowerCase() === 'allergen') {
                allergens.add(tag.name);
            }
        });

        const compatibleDiets = allDiets.filter(diet => {
            return meals.every(meal => {
                // @ts-ignore
                if (!meal.recipes) return true;
                // @ts-ignore
                const tags = meal.recipes.recipe_tags || [];
                // @ts-ignore
                return tags.some((rt: any) => rt.dietary_tags?.id === diet.id);
            });
        });

        const incompatibleDiets = allDiets.filter(d => !compatibleDiets.find(cd => cd.id === d.id));

        return {
            allergens: Array.from(allergens),
            incompatibleDiets
        };
    }, [meals, allDiets]);

    const handleDelete = async () => {
        if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
        try {
            await deleteEvent(id);
            toast.success("Événement supprimé");
            if (onBack) onBack();
            else router.push("/calendar");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleUpdateEvent = async (data: Partial<Event>) => {
        try {
            await updateEvent(id, data);

            // If guest count changed, update all meals
            if (data.guest_count && data.guest_count !== event?.guest_count) {
                await updateEventMealsServings(id, data.guest_count);
                // Also refresh meals to reflect changes
                const updatedMeals = await getEventMeals(id);
                setMeals(updatedMeals);
            }

            const updated = await getEventById(id);
            setEvent(updated);
            setIsEditOpen(false);
            toast.success("Événement mis à jour");
        } catch (error) {
            toast.error("Erreur de mise à jour");
        }
    };

    if (loading) return <div className="flex h-60 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
    if (!event) return <div>Event Not Found</div>;

    return (
        <TooltipProvider>
            <div className="max-w-6xl mx-auto pb-20 space-y-8 p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800">
                {/* Back Link - Only if onBack provided or if separate page */}
                {onBack ? (
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 pl-0" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Fermer le planning
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                        <Link href="/calendar" className="flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" /> Retour au calendrier
                        </Link>
                    </div>
                )}

                {/* Split Header Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left: Image */}
                    <div className="relative aspect-[4/3] lg:aspect-square w-full rounded-xl overflow-hidden bg-slate-100 shadow-sm group">
                        {event.image_url ? (
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                <CalendarDays className="h-20 w-20 opacity-50" />
                            </div>
                        )}
                        {/* Status Badge Overlay */}
                        <div className="absolute top-4 right-4 z-10">
                            {new Date(event.end_date) < new Date() ? (
                                <Badge variant="secondary" className="bg-slate-100/90 backdrop-blur text-slate-500 border-none shadow-sm">Terminé</Badge>
                            ) : new Date(event.start_date) <= new Date() ? (
                                <Badge className="bg-green-500/90 backdrop-blur text-white border-none shadow-sm animate-pulse">En cours</Badge>
                            ) : (
                                <Badge className="bg-blue-500/90 backdrop-blur text-white border-none shadow-sm">À venir</Badge>
                            )}
                        </div>
                    </div>

                    {/* Right: Info Panel */}
                    <div className="flex flex-col h-full">
                        {/* Header: Title Left, Actions Right */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col gap-3 flex-1 pr-4">
                                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight font-serif text-balance">
                                    {event.title}
                                </h1>
                                {event.company_name && (
                                    <span className="text-lg text-slate-500 font-medium">{event.company_name}</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-400 hover:text-slate-900"
                                        onClick={() => isAssistantMode ? setIsWizardOpen(true) : setIsEditOpen(true)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>

                                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Modifier l'événement</DialogTitle>
                                            </DialogHeader>
                                            {event && (
                                                <EventForm
                                                    initialData={event}
                                                    onSubmit={(data) => handleUpdateEvent(data)}
                                                    onCancel={() => setIsEditOpen(false)}
                                                />
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Info Rows */}
                        <div className="space-y-6 flex-1">
                            {/* Dates */}
                            <div className="flex items-center gap-3 text-slate-600">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <span className="font-medium">
                                    Du {format(parseISO(event.start_date), 'd MMMM')} au {format(parseISO(event.end_date), 'd MMMM yyyy', { locale: fr })}
                                </span>
                            </div>

                            {/* Guest Count */}
                            <div className="flex items-center gap-3 text-slate-600">
                                <Users className="h-5 w-5 text-slate-400" />
                                <span className="font-medium">
                                    {event.guest_count} Couverts
                                </span>
                            </div>

                            {/* Contact Name */}
                            {(event.contact_name || event.contact_email || event.contact_phone) && (
                                <div className="flex items-start gap-3 text-slate-600">
                                    <User className="h-5 w-5 text-slate-400 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{event.contact_name || "Contact inconnu"}</span>
                                        {event.contact_email && <a href={`mailto:${event.contact_email}`} className="text-sm text-slate-400 hover:text-primary">{event.contact_email}</a>}
                                        {event.contact_phone && <a href={`tel:${event.contact_phone}`} className="text-sm text-slate-400 hover:text-primary">{event.contact_phone}</a>}
                                    </div>
                                </div>
                            )}

                            {/* Notes (Description) */}
                            {event.notes && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 italic leading-relaxed">
                                    "{event.notes}"
                                </div>
                            )}

                            {/* Allergens & Diets */}
                            <div className="space-y-3 pt-2">
                                {analysis.allergens.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {analysis.allergens.map(allergen => (
                                            <div key={allergen} className="flex items-center gap-1.5 text-sm text-slate-600">
                                                <div className="p-1 rounded-full bg-orange-50 text-orange-500">
                                                    {getIconForTag(allergen, 'allergen')}
                                                </div>
                                                <span className="text-xs font-medium text-slate-500">{allergen}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {analysis.incompatibleDiets && analysis.incompatibleDiets.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {analysis.incompatibleDiets.slice(0, 5).map(diet => (
                                            <div key={diet.id} className="flex items-center gap-1.5 text-sm text-slate-500/80">
                                                <div className="p-1 rounded-full bg-slate-50 text-slate-400">
                                                    {getIconForTag(diet.name, 'diet')}
                                                </div>
                                                <span className="text-xs text-slate-400 line-through decoration-slate-300">{diet.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Calculator Box */}
                        <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-4">
                            {/* Header: Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200/60">
                                {/* Margin Control */}
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Marge Cible</span>
                                        <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
                                            {margin}%
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-slate-300" onClick={() => setMargin(Math.max(0, margin - 5))} disabled={margin <= 0}>-</Button>
                                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-slate-300" onClick={() => setMargin(Math.min(99, margin + 5))}>+</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="space-y-4">
                                {/* Row 1: Per Person */}
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {/* Weight */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Poids/pers</span>
                                        <span className="font-bold text-slate-700 text-sm">
                                            {derivedMetrics.weightPerServing > 0 ? `${Math.round(derivedMetrics.weightPerServing)}g` : '-'}
                                        </span>
                                    </div>
                                    {/* Cost */}
                                    <div className="flex flex-col border-l border-slate-200">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Coût/pers</span>
                                        <span className="font-bold text-slate-900 text-sm">{derivedMetrics.costPerServing.toFixed(2)}€</span>
                                    </div>
                                    {/* Price */}
                                    <div className="flex flex-col border-l border-slate-200">
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-0.5">Prix/pers</span>
                                        <span className="font-bold text-emerald-600 text-sm">{derivedMetrics.sellingPricePerServing.toFixed(2)}€</span>
                                    </div>
                                    {/* Benefit */}
                                    <div className="flex flex-col border-l border-slate-200 bg-emerald-50/50 -my-2 py-2 rounded-r-lg">
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-0.5">Bénéfice</span>
                                        <span className="font-bold text-emerald-700 text-sm">+{derivedMetrics.profitPerServing.toFixed(2)}€</span>
                                    </div>
                                </div>

                                {/* Row 2: Projected Totals */}
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-xs font-medium text-slate-500">Coût Total :</span>
                                        <span className="font-bold text-slate-700">
                                            {derivedMetrics.totalCost.toFixed(2)}€
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-xs font-medium text-emerald-600">Prix Total :</span>
                                        <span className="font-bold text-emerald-700">
                                            {derivedMetrics.sellingPriceTotal.toFixed(2)}€
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="max-w-4xl mx-auto mt-12">
                    <Tabs defaultValue="planning" className="w-full">
                        <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent p-0 mb-8 h-auto space-x-8 rounded-none">
                            <TabsTrigger
                                value="planning"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold text-lg text-slate-400 data-[state=active]:text-slate-900 transition-all shadow-none"
                            >
                                Planning
                            </TabsTrigger>
                            <TabsTrigger
                                value="shopping"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold text-lg text-slate-400 data-[state=active]:text-slate-900 transition-all shadow-none"
                            >
                                Liste de courses
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="planning">
                            <EventPlanningTab event={event} meals={meals} setMeals={setMeals} />
                        </TabsContent>

                        <TabsContent value="shopping">
                            <EventShoppingTab event={event} meals={meals} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {isWizardOpen && event && (
                <EventWizard
                    initialData={event!}
                    onClose={() => setIsWizardOpen(false)}
                    onSubmit={async (data) => {
                        await handleUpdateEvent(data);
                        setIsWizardOpen(false);
                    }}
                />
            )
            }
        </TooltipProvider >
    );
}
