"use client";


import { RecipeList } from "@/components/recipes/recipe-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function RecipesPage() {
  return (
    <div className="space-y-8 container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Mes Recettes</h1>
          <p className="text-slate-500">Gérez vos fiches techniques et coûts matières.</p>
        </div>
        <Link href="/recipes/new">
          <Button size="lg" className="text-lg px-6">
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle Recette
          </Button>
        </Link>
      </div>

      <RecipeList />
    </div>
  );
}

