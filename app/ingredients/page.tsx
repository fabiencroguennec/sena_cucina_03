"use client";

import { useState } from "react";
import { IngredientsList } from "@/components/ingredients/ingredients-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function IngredientsPage() {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="space-y-8 container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Ingrédients</h1>
                    <p className="text-slate-500">Gérez votre Mercuriale : prix, fournisseurs et unités.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} size="lg" className="text-lg px-6">
                    <Plus className="mr-2 h-5 w-5" />
                    Ajouter un produit
                </Button>
            </div>
            <IngredientsList isCreating={isCreating} onToggleCreating={setIsCreating} />
        </div>
    );
}
