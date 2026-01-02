"use client";

import { useEffect, useState } from "react";
import { getRecipes, deleteRecipe, Recipe, getTags, DietaryTag } from "@/lib/api/recipes";
import { Button } from "@/components/ui/button";
import { ChefHat, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { FilterSheet } from "./filter-sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RecipeCard } from "./recipe-card";
import { RecipeTable } from "./recipe-table";

// Define a type for Recipe with tags included in the fetch
type RecipeWithTags = Recipe & {
    recipe_tags: {
        tag_id: string;
        dietary_tags: {
            id: string;
            name: string;
            type: 'allergen' | 'diet' | 'category' | 'theme';
        } | null;
    }[];
    prep_time?: number;
    cook_time?: number;
    rating?: number;
};



export function RecipeList() {
    const [recipes, setRecipes] = useState<RecipeWithTags[]>([]);
    const [allDiets, setAllDiets] = useState<DietaryTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Advanced Filter State
    const [filters, setFilters] = useState<{
        type: string[];
        theme: string[];
        time: string[];
        rating: string[];
    }>({
        type: [],
        theme: [],
        time: [],
        rating: []
    });

    useEffect(() => {
        Promise.all([
            getRecipes(),
            getTags('diet')
        ]).then(([recipeData, dietData]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRecipes(recipeData as any);
            setAllDiets(dietData);
            setLoading(false);
        });
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteRecipe(deleteId);
            setRecipes(recipes.filter(r => r.id !== deleteId));
            toast.success("Recette supprimée");
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredRecipes = recipes.filter(r => {
        // Filter by Type (Category) - OR logic within types
        if (filters.type.length > 0) {
            const hasType = r.recipe_tags?.some(rt => filters.type.includes(rt.tag_id));
            if (!hasType) return false;
        }

        // Filter by Theme
        if (filters.theme.length > 0) {
            const hasTheme = r.recipe_tags?.some(rt => filters.theme.includes(rt.tag_id));
            if (!hasTheme) return false;
        }

        // Filter by Time
        if (filters.time.length > 0) {
            const totalTime = (r.prep_time || 0) + (r.cook_time || 0);
            const matchesTime = filters.time.some(t => {
                if (t === "< 15 min") return totalTime <= 15;
                if (t === "< 30 min") return totalTime <= 30;
                if (t === "< 60 min") return totalTime <= 60;
                return false;
            });
            if (!matchesTime) return false;
        }

        // Filter by Rating
        if (filters.rating.length > 0) {
            const recipeRating = r.rating || 0;
            const matchesRating = filters.rating.some(criteria => {
                if (criteria === "5 étoiles") return recipeRating === 5;
                if (criteria === "4 étoiles et +") return recipeRating >= 4;
                if (criteria === "3 étoiles et +") return recipeRating >= 3;
                return false;
            });
            if (!matchesRating) return false;
        }

        return true;
    });

    if (loading) {
        return <div className="text-center py-20 text-slate-400 animate-pulse">Chargement des recettes...</div>;
    }

    if (recipes.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-xl ">
                <ChefHat className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Aucune recette</h3>
                <p className="text-slate-500 mb-6">Commencez par créer votre première fiche technique.</p>
                <Link href="/recipes/new">
                    <Button>Créer une recette</Button>
                </Link>
            </div>
        );
    }

    const activeFilterCount = filters.type.length + filters.theme.length + filters.time.length;

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Filter Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-500">
                            {filteredRecipes.length} recette{filteredRecipes.length > 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={viewMode === 'grid' ? "bg-white dark:bg-slate-950 shadow-sm h-7 w-7 p-0" : "h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={viewMode === 'list' ? "bg-white dark:bg-slate-950 shadow-sm h-7 w-7 p-0" : "h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                        <FilterSheet filters={filters} onFilterChange={setFilters} />
                    </div>
                </div>

                {/* Active Filters Display (Optional but nice) */}
                {activeFilterCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {/* We could map tags names here if we had them in context, simpler to rely on sheet for now or fetch tags map */}
                    </div>
                )}


                {/* Empty State for Filter */}
                {filteredRecipes.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Aucune recette ne correspond à vos filtres.</p>
                        <Button variant="link" onClick={() => setFilters({ type: [], theme: [], time: [], rating: [] })}>Tout effacer</Button>
                    </div>
                )}

                {/* Grid or List */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecipes.map((recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                allDiets={allDiets}
                                onDelete={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteId(recipe.id);
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <RecipeTable
                        recipes={filteredRecipes}
                        onDelete={(id) => setDeleteId(id)}
                    />
                )}

                <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Supprimer la recette ?</DialogTitle>
                            <DialogDescription>
                                Cette action est irréversible. La recette et tout son historique seront effacés.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>Annuler</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? "Suppression..." : "Supprimer"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
