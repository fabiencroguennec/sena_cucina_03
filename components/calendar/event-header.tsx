"use client";

import { Event, EventMeal } from "@/lib/types/calendar";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
    CalendarDays, Users, Building2, Phone, Mail,
    Wallet, TrendingUp, AlertTriangle, Wheat, Info,
    UtensilsCrossed, ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

interface EventHeaderProps {
    event: Event;
    meals: EventMeal[];
}

export function EventHeader({ event, meals }: EventHeaderProps) {
    // Financial Calculations
    const financials = useMemo(() => {
        let theoreticalSales = 0;
        let totalFoodCost = 0;
        let totalMealsCount = 0;

        meals.forEach(meal => {
            if (meal.recipes && meal.recipes.total_cost && meal.recipes.base_servings) {
                const costPerServing = meal.recipes.total_cost / meal.recipes.base_servings;

                // Calculate theoretical price using recipe margin
                const margin = meal.recipes.target_margin || 0;
                // Avoid division by zero if margin is 100 (unlikely but safe)
                const marginFactor = margin >= 100 ? 0.01 : (1 - margin / 100);
                const pricePerServing = costPerServing / marginFactor;

                const mealCost = costPerServing * meal.target_servings;
                const mealPrice = pricePerServing * meal.target_servings;

                totalFoodCost += mealCost;
                theoreticalSales += mealPrice;
                totalMealsCount++;
            }
        });

        // Toggle: Use event manual price OR theoretical?
        // User requested: "pour le budget(vente) utilise le prix calculé"
        // So we use theoreticalSales as the displayed Budget.
        const sellingPrice = theoreticalSales;

        // Make sure we handle profit correctly based on this calculated price
        const profit = sellingPrice - totalFoodCost;
        const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
        const avgCostPerPlate = totalMealsCount > 0 ? (totalFoodCost / meals.reduce((acc, m) => acc + m.target_servings, 0)) : 0;

        // Cost per person (Total Food Cost)
        const costPerGuest = event.guest_count > 0 ? (totalFoodCost / event.guest_count) : 0;

        // Price per person (Total Selling Price)
        const pricePerGuest = event.guest_count > 0 ? (sellingPrice / event.guest_count) : 0;

        return {
            totalFoodCost,
            sellingPrice,
            profit,
            margin,
            costPerGuest,
            pricePerGuest
        };
    }, [event, meals]);

    const daysCount = differenceInDays(parseISO(event.end_date), parseISO(event.start_date)) + 1;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-8 transition-all duration-300">
            {/* Banner / Cover */}
            <div
                className="h-28 bg-slate-100 relative overflow-hidden cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {event.image_url ? (
                    <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-100 flex items-center justify-center text-slate-300">
                        <UtensilsCrossed className="w-12 h-12 opacity-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-4 left-6 text-white flex items-center justify-between w-[calc(100%-3rem)]">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {event.title}
                            {event.company_name && (
                                <Badge variant="outline" className="text-white border-white/50 font-normal bg-white/10 backdrop-blur-sm">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {event.company_name}
                                </Badge>
                            )}
                        </h1>
                        <div className="flex items-center gap-4 mt-1 text-white/90 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4" />
                                {format(parseISO(event.start_date), 'd MMM', { locale: fr })} - {format(parseISO(event.end_date), 'd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {event.guest_count} pers.
                            </span>
                            <span>• {daysCount} jours</span>
                        </div>
                    </div>
                    <ChevronDown className={cn("text-white w-6 h-6 transition-transform", isExpanded ? "rotate-180" : "rotate-0")} />
                </div>
            </div>

            {/* Content Grid */}
            <div className={cn(
                "grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-500 ease-in-out overflow-hidden",
                isExpanded ? "max-h-[1000px] opacity-100 p-6" : "max-h-0 opacity-0 p-0"
            )}>

                {/* 1. Details Column */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Contact */}
                    {(event.contact_name || event.contact_email || event.contact_phone) && (
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            {event.contact_name && (
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-900">{event.contact_name}</span>
                                </div>
                            )}
                            {event.contact_phone && (
                                <a href={`tel:${event.contact_phone}`} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border hover:bg-slate-100 transition-colors">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span>{event.contact_phone}</span>
                                </a>
                            )}
                            {event.contact_email && (
                                <a href={`mailto:${event.contact_email}`} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border hover:bg-slate-100 transition-colors">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="truncate max-w-[200px]">{event.contact_email}</span>
                                </a>
                            )}
                        </div>
                    )}

                    {/* Regimes & Allergenes Grid */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        {/* Diets */}
                        {event.diets && Object.keys(event.diets).length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Wheat className="w-4 h-4" /> Régimes Spéciaux
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(event.diets).map(([diet, count]) => (
                                        <Badge key={diet} variant="secondary" className="font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100">
                                            {diet}: <span className="ml-1 font-bold">{count}</span>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Allergens */}
                        {event.allergens && event.allergens.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-4 h-4" /> Allergènes
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {event.allergens.map(allergen => (
                                        <Badge key={allergen} variant="outline" className="border-red-200 bg-red-50 text-red-700">
                                            {allergen}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {event.notes && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed">
                            <div className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                                <Info className="w-4 h-4" /> Remarques
                            </div>
                            {event.notes}
                        </div>
                    )}
                </div>

                {/* 2. Financials Column */}
                <div className="bg-slate-50/50 rounded-xl border p-5 space-y-5 h-fit">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-slate-500" />
                            Finances
                        </h3>
                        {financials.sellingPrice > 0 && (
                            <Badge variant={financials.profit >= 0 ? "default" : "destructive"}>
                                {financials.profit >= 0 ? "+" : ""}{financials.margin.toFixed(0)}%
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-slate-500">Budget (Calculé)</span>
                            <span className="font-semibold text-lg text-slate-900">{financials.sellingPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-slate-500">Coût Alimentaire</span>
                            <span className="font-medium text-slate-700">{financials.totalFoodCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        </div>

                        <div className="h-px bg-slate-200 my-2" />

                        <div className="flex justify-between items-baseline">
                            <span className="text-sm font-medium text-slate-900">Bénéfice Brut</span>
                            <span className={cn("font-bold text-lg", financials.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {financials.profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-white p-3 rounded border text-center">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Coût / Pers.</div>
                            <div className="font-semibold text-slate-700">{financials.costPerGuest.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                        </div>
                        <div className="bg-white p-3 rounded border text-center">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Prix / Pers.</div>
                            <div className="font-semibold text-slate-700">
                                {financials.pricePerGuest.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
