"use client";

import { useEffect, useState } from "react";
import { getMealsByDate } from "@/lib/api/calendar";
import { EventMeal, Event } from "@/lib/types/calendar";
import { Loader2, Utensils } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface DayPreviewProps {
    date: Date;
}

export function DayPreview({ date }: DayPreviewProps) {
    // @ts-ignore
    const [meals, setMeals] = useState<(EventMeal & { events: Event })[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const dateStr = format(date, 'yyyy-MM-dd');
        getMealsByDate(dateStr)
            .then(data => setMeals(data))
            .finally(() => setLoading(false));
    }, [date]);

    const grouped = {
        breakfast: meals.filter(m => m.meal_type === 'breakfast'),
        lunch: meals.filter(m => m.meal_type === 'lunch'),
        dinner: meals.filter(m => m.meal_type === 'dinner'),
    };

    if (loading) return (
        <div className="flex justify-center py-10 bg-white rounded-xl border">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
    );

    if (meals.length === 0) return (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Utensils className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-slate-500">Aucun menu prévu pour le {format(date, 'd MMMM', { locale: fr })}.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <h3 className="font-serif text-xl font-bold text-slate-900 border-b pb-4">
                Menu du {format(date, 'EEEE d MMMM', { locale: fr })}
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
                {(['breakfast', 'lunch', 'dinner'] as const).map(type => (
                    <div key={type} className="space-y-3">
                        <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider">
                            {type === 'breakfast' ? 'Petit Déjeuner' : type === 'lunch' ? 'Déjeuner' : 'Dîner'}
                        </h4>

                        {grouped[type].length === 0 ? (
                            <p className="text-sm text-slate-300 italic">Rien de prévu</p>
                        ) : (
                            <div className="space-y-2">
                                {grouped[type].map(meal => (
                                    <div key={meal.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-primary/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <Link href={`/recipes/${meal.recipe_id}/cook?servings=${meal.target_servings}`} className="hover:underline">
                                                <span className="font-medium text-slate-800 line-clamp-1">
                                                    {meal.recipes?.title || "Recette inconnue"}
                                                </span>
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Link href={`/calendar/${meal.event_id}`}>
                                                <Badge variant="secondary" className="px-1.5 py-0 h-5 font-normal text-[10px] bg-white border hover:bg-slate-100 cursor-pointer" style={{ color: meal.events?.color }}>
                                                    {meal.events?.title}
                                                </Badge>
                                            </Link>
                                            <span className="text-slate-400">
                                                {meal.target_servings} pers.
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
