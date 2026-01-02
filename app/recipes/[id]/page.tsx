"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getRecipeById, FullRecipe, getTags, DietaryTag, deleteRecipe } from "@/lib/api/recipes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2, Users, ArrowLeft, Utensils, Edit, Clock,
    Wheat, Milk, Egg, Nut, Fish, Bean, Leaf, Sprout,
    WheatOff, MilkOff, Shell, CircleAlert, Printer, Trash2,
    Play, Disc, ShoppingBag, UtensilsCrossed, CookingPot, FileDown
} from "lucide-react";
import { exportRecipePDF } from "@/lib/pdf-export";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UNIT_OPTIONS } from "@/lib/validators/ingredient";
import { StarRating } from "@/components/ui/star-rating";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { getConvertedCost } from "@/lib/pricing";
import { convertQuantity } from "@/lib/conversions";
import { Slider } from "@/components/ui/slider";
import { ShoppingListDialog } from "@/components/recipes/shopping-list-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { IngredientPriceHistory } from "@/components/ingredients/ingredient-price-history";
import { getIngredientById, Ingredient } from "@/lib/api/ingredients";
import { History } from "lucide-react";

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

export default function RecipeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [recipe, setRecipe] = useState<FullRecipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

    // Financial State (Calculator)
    const [margin, setMargin] = useState<number>(0);
    const [plateSize, setPlateSize] = useState<'large' | 'small'>('large');

    // Viewer State (Ingredient Scaling)
    const [scalingServings, setScalingServings] = useState<number>(4);

    const [allDiets, setAllDiets] = useState<DietaryTag[]>([]);

    useEffect(() => {
        // Fetch all diets for calculation
        getTags('diet').then(setAllDiets).catch(console.error);
    }, []);

    useEffect(() => {
        if (id) {
            getRecipeById(id).then((data) => {
                setRecipe(data);
                if (data) {
                    setMargin(data.target_margin || 70);
                    // Init scaling to base servings
                    setScalingServings(data.base_servings);
                }
                setLoading(false);
            });
        }
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette recette ? Cette action est irréversible.")) return;

        try {
            await deleteRecipe(id);
            toast.success("Recette supprimée");
            router.push("/recipes");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la suppression");
        }
    };

    // 1. Calculate Financials (Based on Fixed Plate Sizes)
    const activeServings = useMemo(() => {
        if (!recipe) return 1;
        const s1 = recipe.base_servings || 1;
        const s2 = recipe.base_servings_small || 1;
        // Large Plate = Minimum servings (Larger portion per person)
        // Small Plate = Maximum servings (Smaller portion per person)
        if (plateSize === 'large') return Math.min(s1, s2);
        return Math.max(s1, s2);
    }, [recipe, plateSize]);

    const financialMetrics = useMemo(() => {
        if (!recipe) return {
            costPerServing: 0,
            totalCost: 0,
            sellingPricePerServing: 0,
            sellingPriceTotal: 0,
            profitPerServing: 0,
            profitTotal: 0,
            weightPerServing: 0
        };

        // We need to calculate based on the RAW recipe quantities (for the whole batch)
        // Then divide by activeServings
        const totalCost = recipe.recipe_items.reduce((acc, item) => {
            return acc + getConvertedCost(
                item.ingredients?.price_per_unit || 0,
                item.ingredients?.unit || 'kg',
                item.quantity_needed,
                item.unit
            );
        }, 0);

        const costPerServing = totalCost / activeServings;

        // Selling Price Logic
        const marginDecimal = margin / 100;
        const sellingPriceTotal = marginDecimal >= 1 ? 0 : totalCost / (1 - marginDecimal);
        const sellingPricePerServing = sellingPriceTotal / activeServings;
        const profitTotal = sellingPriceTotal - totalCost;
        const profitPerServing = profitTotal / activeServings;

        // Weight Logic
        const totalWeightGrams = recipe.recipe_items.reduce((acc, item) => {
            if (['kg', 'g', 'l', 'cl', 'ml'].includes(item.unit)) {
                return acc + convertQuantity(item.quantity_needed, item.unit, 'g');
            }
            return acc;
        }, 0);
        const weightPerServing = totalWeightGrams / activeServings;

        return {
            totalCost,
            costPerServing,
            sellingPriceTotal,
            sellingPricePerServing,
            profitTotal,
            profitPerServing,
            weightPerServing
        };
    }, [recipe, activeServings, margin]);


    // 2. Calculate Displayed Ingredients (Based on User Scaling)
    const scaledItems = useMemo(() => {
        if (!recipe) return [];
        // Ratio based on Standard Base Servings (usually the 'large' one / min count acts as reference, but technically recipe quantities are for 'base_servings')
        // Actually, recipe.quantity_needed corresponds to recipe.base_servings.
        const ratio = scalingServings / (recipe.base_servings || 1);

        return recipe.recipe_items.map((item) => ({
            ...item,
            scaledQuantity: item.quantity_needed * ratio,
        }));
    }, [recipe, scalingServings]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold">Recette introuvable</h2>
                <Link href="/recipes" className="text-primary hover:underline mt-4 inline-block">
                    Retour aux recettes
                </Link>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="max-w-6xl mx-auto pb-20 space-y-8">
                {/* Back Link */}
                <div className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    <Link href="/recipes" className="flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Retour aux recettes
                    </Link>
                </div>

                {/* Split Header Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left: Image with Play Overlay */}
                    <div className="relative aspect-[4/3] lg:aspect-square w-full rounded-xl overflow-hidden bg-slate-100 shadow-sm group">
                        {recipe.image_url ? (
                            <Image
                                src={recipe.image_url}
                                alt={recipe.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                <Utensils className="h-20 w-20 opacity-50" />
                            </div>
                        )}

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Link href={`/recipes/${id}/cook`}>
                                <div className="h-20 w-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transform transition-all duration-300 group-hover:scale-110 group-hover:bg-white cursor-pointer group-hover:shadow-xl">
                                    <Play className="h-8 w-8 text-slate-900 ml-1 fill-slate-900" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Right: Info Panel */}
                    <div className="flex flex-col h-full">
                        {/* Header: Title/Tags Left, Actions/Times Right */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col gap-3 flex-1 pr-4">
                                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight font-serif text-balance">
                                    {recipe.title}
                                </h1>

                                {/* Rating & Categories */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <StarRating value={recipe.rating || 0} readOnly size={16} />
                                        {recipe.rating ? (
                                            <span className="text-sm text-slate-500 font-medium">({recipe.rating}/5)</span>
                                        ) : null}
                                    </div>

                                    {/* Categories */}
                                    {recipe.recipe_tags?.filter(t => t.dietary_tags?.type === 'category' || t.dietary_tags?.type === 'theme').map(tag => (
                                        <Badge key={tag.tag_id} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-none px-2.5 py-0.5 font-normal text-xs">
                                            {tag.dietary_tags?.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Actions & Times */}
                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                <div className="flex gap-1">
                                    <Link href={`/recipes/${id}/edit`}>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => window.print()} title="Imprimer la page">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => {
                                        if (recipe) {
                                            exportRecipePDF(
                                                recipe.title,
                                                scalingServings,
                                                scaledItems.map(i => ({
                                                    name: i.ingredients?.name || 'Inconnu',
                                                    quantity: i.scaledQuantity,
                                                    unit: i.unit
                                                }))
                                            );
                                        }
                                    }} title="Exporter Liste Ingrédients (PDF)">
                                        <FileDown className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={handleDelete} title="Supprimer la recette">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Stacked Time Badges */}
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <UtensilsCrossed className="h-3.5 w-3.5 text-slate-400" />
                                        {recipe.prep_time || 0} min
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <CookingPot className="h-3.5 w-3.5 text-slate-400" />
                                        {recipe.cook_time || 0} min
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {recipe.description && (
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                {recipe.description}
                            </p>
                        )}

                        {/* Middle: Allergens & Incompatible Diets */}
                        <div className="space-y-3 mb-6">
                            {/* Allergens (Detected) */}
                            {recipe.recipe_tags?.some(t => t.dietary_tags?.type === 'allergen') && (
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {recipe.recipe_tags?.filter(t => t.dietary_tags?.type === 'allergen').map(tag => (
                                        <div key={tag.tag_id} className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <div className="p-1 rounded-full bg-orange-50 text-orange-500">
                                                {tag.dietary_tags && getIconForTag(tag.dietary_tags.name, 'allergen')}
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">{tag.dietary_tags?.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Incompatible Diets */}
                            {allDiets.some(d => !recipe.recipe_tags?.some(rt => rt.tag_id === d.id)) && (
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {allDiets
                                        .filter(d => !recipe.recipe_tags?.some(rt => rt.tag_id === d.id))
                                        .map(diet => (
                                            <div key={diet.id} className="flex items-center gap-1.5 text-sm text-slate-500/80">
                                                <div className="p-1 rounded-full bg-slate-50 text-slate-400">
                                                    {getIconForTag(diet.name, 'diet')}
                                                </div>
                                                <span className="text-xs text-slate-400 line-through decoration-slate-300">{diet.name}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* Financial Calculator Box */}
                        <div className="mt-auto bg-slate-50 rounded-xl border border-slate-200 p-4">
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

                                {/* Plate Size Toggle */}
                                <div className="flex items-center gap-2 bg-white px-1 py-1 rounded-lg border border-slate-200 shadow-sm">
                                    <button
                                        onClick={() => setPlateSize('large')}
                                        className={cn(
                                            "p-1.5 rounded-md transition-all",
                                            plateSize === 'large' ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-300 hover:text-slate-500"
                                        )}
                                        title="Grande Assiette (Grosse portion, min couverts)"
                                    >
                                        <Disc className="h-4 w-4 fill-current" />
                                    </button>
                                    <div className="h-4 w-px bg-slate-100 mx-0.5" />
                                    <button
                                        onClick={() => setPlateSize('small')}
                                        className={cn(
                                            "p-1.5 rounded-md transition-all",
                                            plateSize === 'small' ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-300 hover:text-slate-500"
                                        )}
                                        title="Petite Assiette (Petite portion, max couverts)"
                                    >
                                        <Disc className="h-3 w-3 fill-current" />
                                    </button>
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
                                            {financialMetrics.weightPerServing > 0 ? `${Math.round(financialMetrics.weightPerServing)}g` : '-'}
                                        </span>
                                    </div>
                                    {/* Cost */}
                                    <div className="flex flex-col border-l border-slate-200">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Coût/pers</span>
                                        <span className="font-bold text-slate-900 text-sm">{financialMetrics.costPerServing.toFixed(2)}€</span>
                                    </div>
                                    {/* Price */}
                                    <div className="flex flex-col border-l border-slate-200">
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-0.5">Prix/pers</span>
                                        <span className="font-bold text-emerald-600 text-sm">{financialMetrics.sellingPricePerServing.toFixed(2)}€</span>
                                    </div>
                                    {/* Benefit (New) */}
                                    <div className="flex flex-col border-l border-slate-200 bg-emerald-50/50 -my-2 py-2 rounded-r-lg">
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-0.5">Bénéfice</span>
                                        <span className="font-bold text-emerald-700 text-sm">+{financialMetrics.profitTotal.toFixed(2)}€</span>
                                    </div>
                                </div>

                                {/* Row 2: Projected Totals (Based on Scaling Servings) */}
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-xs font-medium text-slate-500">Coût Total ({scalingServings}p):</span>
                                        <span className="font-bold text-slate-700">
                                            {(financialMetrics.costPerServing * scalingServings).toFixed(2)}€
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-xs font-medium text-emerald-600">Prix Total ({scalingServings}p):</span>
                                        <span className="font-bold text-emerald-700">
                                            {(financialMetrics.sellingPricePerServing * scalingServings).toFixed(2)}€
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Content Tabs */}
                <div className="max-w-4xl mx-auto mt-12">
                    <Tabs defaultValue="ingredients" className="w-full">
                        <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent p-0 mb-8 h-auto space-x-8 rounded-none">
                            <TabsTrigger
                                value="ingredients"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold text-lg text-slate-400 data-[state=active]:text-slate-900 transition-all shadow-none"
                            >
                                Ingrédients <span className="ml-2 text-sm bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{scaledItems.length}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="instructions"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold text-lg text-slate-400 data-[state=active]:text-slate-900 transition-all shadow-none"
                            >
                                Préparation
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="ingredients">
                            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                                {/* Header with Scaling Controls */}
                                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-end gap-4">
                                    <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setScalingServings(Math.max(1, scalingServings - 1))}
                                                className="text-slate-400 hover:text-slate-600 font-bold h-6 w-6 flex items-center justify-center"
                                            >
                                                -
                                            </button>
                                            <span className="font-bold text-slate-900 w-4 text-center">{scalingServings}</span>
                                            <button
                                                onClick={() => setScalingServings(scalingServings + 1)}
                                                className="text-slate-400 hover:text-slate-600 font-bold h-6 w-6 flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <ShoppingListDialog
                                        title={recipe.title}
                                        servings={scalingServings}
                                        items={scaledItems}
                                    />
                                </div>

                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-medium">
                                            <tr>
                                                <th className="text-left p-4 pl-6">Ingrédient</th>
                                                <th className="text-right p-4 w-32">Quantité</th>
                                                <th className="text-left p-4 w-24">Unité</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {scaledItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 pl-6 font-medium text-slate-900">
                                                        <button
                                                            onClick={() => setSelectedIngredientId(item.ingredients?.id || null)}
                                                            className="hover:text-primary hover:underline text-left font-medium transition-colors"
                                                        >
                                                            {item.ingredients?.name || "Ingrédient inconnu"}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-600 font-medium">
                                                        {Number.isInteger(item.scaledQuantity)
                                                            ? item.scaledQuantity
                                                            : item.scaledQuantity.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-xs uppercase">
                                                        {UNIT_OPTIONS.find(u => u.value === item.unit)?.label || item.unit || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Footer Removed as requested */}
                                    </table>
                                </CardContent>
                            </Card>

                            {/* Incompatible Diets Note */}


                        </TabsContent>

                        <TabsContent value="instructions" className="space-y-12">
                            {recipe.recipe_steps
                                .sort((a, b) => a.step_order - b.step_order)
                                .map((step, index) => (
                                    <div key={step.id} className="flex gap-6 md:gap-8 group">
                                        {/* Step Number */}
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-slate-200 text-slate-400 font-bold text-lg flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                                                {step.step_order}
                                            </div>
                                        </div>

                                        {/* Step Content */}
                                        <div className="flex-1 pt-1 space-y-4">
                                            <div className="prose prose-slate max-w-none">
                                                <p className="text-slate-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                                                    {step.instruction_text}
                                                </p>
                                            </div>
                                            {step.image_url && (
                                                <div className="relative aspect-video w-full max-w-xl rounded-lg overflow-hidden bg-slate-100 shadow-sm mt-4">
                                                    <Image
                                                        src={step.image_url}
                                                        alt={`Étape ${step.step_order}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {/* Edit Steps Shortcut */}
                            <div className="flex justify-center pt-8 border-t border-slate-100">
                                <Link href={`/recipes/${id}/edit`}>
                                    <Button variant="outline" className="text-slate-500 hover:text-primary hover:bg-slate-50 border-dashed">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier / Ajouter des étapes
                                    </Button>
                                </Link>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <IngredientModal
                    id={selectedIngredientId}
                    isOpen={!!selectedIngredientId}
                    onClose={() => setSelectedIngredientId(null)}
                    onUpdate={() => {
                        if (id) getRecipeById(id).then(data => {
                            setRecipe(data);
                            if (data) setMargin(data.target_margin || 70);
                        });
                    }}
                />
            </div>
        </TooltipProvider >
    );
}

function IngredientModal({ id, isOpen, onClose, onUpdate }: { id: string | null, isOpen: boolean, onClose: () => void, onUpdate?: () => void }) {
    const [ingredient, setIngredient] = useState<Ingredient | null>(null);
    useEffect(() => {
        if (id && isOpen) {
            getIngredientById(id).then(setIngredient).catch(console.error);
        } else {
            setIngredient(null);
        }
    }, [id, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 p-0 gap-0">
                <DialogHeader className="p-6 pb-2 bg-white dark:bg-slate-900 border-b">
                    <DialogTitle className="text-xl">{ingredient ? ingredient.name : 'Chargement...'}</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    {ingredient ? (
                        <Tabs defaultValue="edit" className="w-full">
                            <TabsList className="mb-6 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                                <TabsTrigger value="edit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
                                    <span className="flex items-center gap-2"><Edit className="h-4 w-4" /> Modification</span>
                                </TabsTrigger>
                                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
                                    <span className="flex items-center gap-2"><History className="h-4 w-4" /> Historique Prix</span>
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="edit" className="mt-0">
                                <IngredientForm
                                    initialData={ingredient}
                                    onSuccess={() => {
                                        if (onUpdate) onUpdate();
                                    }}
                                    onCancel={onClose}
                                />
                            </TabsContent>
                            <TabsContent value="history" className="mt-0">
                                <IngredientPriceHistory ingredientId={id!} />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
