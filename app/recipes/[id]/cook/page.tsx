"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getRecipeById, FullRecipe } from "@/lib/api/recipes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Maximize2, Minimize2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";
import { UNIT_OPTIONS } from "@/lib/validators/ingredient";

export default function CookingModePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params.id as string;
    const [recipe, setRecipe] = useState<FullRecipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [servings, setServings] = useState<number>(0);
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Fetch Recipe
    useEffect(() => {
        if (id) {
            getRecipeById(id).then((data) => {
                setRecipe(data);
                if (data) {
                    const paramServings = searchParams.get("servings");
                    setServings(paramServings ? parseInt(paramServings) : data.base_servings);
                }
                setLoading(false);
            });
        }
    }, [id, searchParams]);

    // Wake Lock Logic
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const nav = navigator as any;
                    const lock = await nav.wakeLock.request('screen');
                    setWakeLock(lock);
                    console.log('Wake Lock active');
                } catch (err) {
                    console.error(`${err}`);
                }
            }
        };

        requestWakeLock();

        return () => {
            if (wakeLock) {
                wakeLock.release().then(() => {
                    setWakeLock(null);
                    console.log('Wake Lock released');
                });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fullscreen Toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch((e) => {
                console.error(e);
                toast.error("Impossible d'activer le plein écran");
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => setIsFullscreen(false));
            }
        }
    };

    // Scaling Logic
    const scaledItems = useMemo(() => {
        if (!recipe) return [];
        const ratio = servings / recipe.base_servings;
        return recipe.recipe_items.map((item) => ({
            ...item,
            scaledQuantity: item.quantity_needed * ratio,
        }));
    }, [recipe, servings]);

    // Step Toggle Logic
    const toggleStep = (stepId: string) => {
        const newCompleted = new Set(completedSteps);
        if (newCompleted.has(stepId)) {
            newCompleted.delete(stepId);
        } else {
            newCompleted.add(stepId);
        }
        setCompletedSteps(newCompleted);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!recipe) return null;

    return (
        <div className={cn("min-h-screen bg-slate-50 flex flex-col", isFullscreen && "p-8")}>
            {/* Top Bar */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-4 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold line-clamp-1">{recipe.title}</h1>
                        <p className="text-xs text-slate-500">Mode Cuisine • {wakeLock ? "Écran actif" : "Veille normale"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Scaler */}
                    <div className="flex items-center bg-slate-100 rounded-full px-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setServings(Math.max(1, servings - 1))}>-</Button>
                        <span className="font-mono font-bold w-8 text-center">{servings}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setServings(servings + 1)}>+</Button>
                    </div>

                    <Button variant="outline" size="icon" onClick={toggleFullscreen} className="hidden md:flex">
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </header>

            <div className="flex-1 container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Ingredients Sidebar */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 max-h-[calc(100vh-8rem)] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4 font-serif text-slate-800">Ingrédients</h2>
                        <ul className="space-y-3">
                            {scaledItems.map((item) => (
                                <li key={item.id} className="flex justify-between items-baseline border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                    <span className="text-slate-700 font-medium">{item.ingredients?.name}</span>
                                    <span className="text-slate-500 font-mono text-sm whitespace-nowrap ml-4">
                                        <span className="font-bold text-slate-900 text-base">
                                            {Number.isInteger(item.scaledQuantity) ? item.scaledQuantity : item.scaledQuantity.toFixed(2)}
                                        </span>
                                        {" "}
                                        {UNIT_OPTIONS.find(u => u.value === (item.unit || item.ingredients?.unit))?.label || item.unit || item.ingredients?.unit}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Main Steps */}
                <main className="lg:col-span-8 space-y-8 pb-32">
                    {recipe.recipe_steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step, index) => {
                            const isCompleted = completedSteps.has(step.id);
                            return (
                                <div
                                    key={step.id}
                                    className={cn(
                                        "transition-all duration-300 transform",
                                        isCompleted ? "opacity-50 grayscale" : "opacity-100 scale-100"
                                    )}
                                >
                                    <Card
                                        className={cn(
                                            "border-0 shadow-md overflow-hidden cursor-pointer ring-offset-2 transition-all",
                                            isCompleted ? "bg-slate-50" : "bg-white ring-2 ring-transparent hover:ring-primary/20",
                                            !isCompleted && index === 0 && completedSteps.size === 0 && "ring-primary shadow-xl" // Highlight first step if starting
                                        )}
                                        onClick={() => toggleStep(step.id)}
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {step.image_url && (
                                                <div className="md:w-1/3 relative h-48 md:h-auto">
                                                    <Image
                                                        src={step.image_url}
                                                        alt={`Étape ${step.step_order}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 p-6 md:p-8 flex gap-6">
                                                <div className="pt-1">
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full border-2 border-slate-300 flex items-center justify-center font-bold text-slate-400">
                                                            {step.step_order}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-4 flex-1">
                                                    <p className={cn("text-xl md:text-2xl leading-relaxed font-medium text-slate-700 font-serif", isCompleted && "line-through text-slate-400")}>
                                                        {step.instruction_text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}

                    {/* Completion Celebration */}
                    {completedSteps.size === recipe.recipe_steps.length && recipe.recipe_steps.length > 0 && (
                        <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                            <h3 className="text-3xl font-bold text-emerald-600 mb-4">Bon appétit ! 👨‍🍳</h3>
                            <Button size="lg" onClick={() => router.push('/recipes')}>
                                Retour aux recettes
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
