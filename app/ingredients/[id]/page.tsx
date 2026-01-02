"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getIngredientById, Ingredient } from "@/lib/api/ingredients";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, History } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IngredientPriceHistory } from "@/components/ingredients/ingredient-price-history";

export default function IngredientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [ingredient, setIngredient] = useState<Ingredient | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            getIngredientById(id)
                .then((data) => {
                    setIngredient(data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching ingredient:", error);
                    toast.error("Impossible de charger l'ingrédient");
                    setLoading(false);
                });
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!ingredient) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold text-slate-900">Ingrédient introuvable</h2>
                <Link href="/ingredients">
                    <Button variant="outline">Retour à la liste</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 max-w-4xl">
            {/* Header / Back Link */}
            <div className="flex items-center gap-2">
                <Link href="/ingredients">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 -ml-2">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Retour au Répertoire
                    </Button>
                </Link>
            </div>

            {/* Title Section (Optional, IngredientForm has its own identity card, but page needs context) */}
            {/* Actually IngredientForm renders the "Identity" card with the Name input. 
                So we don't need a huge header here, just the form. 
            */}

            <IngredientForm
                initialData={ingredient}
                onSuccess={(updated) => {
                    // Update local state if needed
                    setIngredient(updated);
                }}
                priceHistoryNode={
                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white mt-8">
                        <CardHeader className="px-4 pt-4 pb-2 border-b border-slate-50">
                            <CardTitle className="text-lg font-serif text-slate-800 flex items-center gap-2">
                                <History className="h-5 w-5 text-emerald-600" />
                                Historique Prix & Qualité
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <IngredientPriceHistory ingredientId={ingredient.id} />
                        </CardContent>
                    </Card>
                }
            />
        </div>
    );
}
