"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRecipeById, FullRecipe } from "@/lib/api/recipes";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { RecipeWizard } from "@/components/recipes/recipe-wizard";
import { useAssistantMode } from "@/components/assistant-context";
import { updateRecipe } from "@/lib/api/recipes";

export default function EditRecipePage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [recipe, setRecipe] = useState<FullRecipe | null>(null);
    const [loading, setLoading] = useState(true);
    const { isAssistantMode } = useAssistantMode();

    useEffect(() => {
        if (id) {
            getRecipeById(id)
                .then((data) => {
                    if (data) {
                        setRecipe(data);
                    } else {
                        // Handle not found
                        router.push("/recipes");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    router.push("/recipes");
                })
                .finally(() => setLoading(false));
        }
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!recipe) return null;

    if (isAssistantMode) {
        return (
            <RecipeWizard
                initialData={recipe}
                onClose={() => router.push("/recipes")}
                onUpdate={async (data, cost) => {
                    await updateRecipe(id, data, cost);
                    router.push("/recipes");
                }}
            />
        );
    }

    return <RecipeForm initialData={recipe} />;
}
