
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Clock, Euro, Users, Edit, Trash2, Printer } from 'lucide-react';
import { Recipe } from '@/lib/api/recipes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/ui/star-rating';
import { getIconForTag } from '@/lib/ui-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DietaryTag } from '@/lib/api/recipes';

interface RecipeCardProps {
    recipe: Recipe & {
        prep_time?: number;
        cook_time?: number;
        rating?: number;
        recipe_tags?: {
            tag_id: string;
            dietary_tags: {
                id: string;
                name: string;
                type: 'allergen' | 'diet' | 'category' | 'theme';
            } | null
        }[];
    };
    onDelete?: (e: React.MouseEvent) => void;
    allDiets?: DietaryTag[];
}

export function RecipeCard({ recipe, onDelete, allDiets = [] }: RecipeCardProps) {
    // Calculate Total Time
    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

    return (
        <div className="group relative bg-card text-card-foreground border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <Link href={`/recipes/${recipe.id}`} className="absolute inset-0 z-10">
                <span className="sr-only">Voir la recette</span>
            </Link>

            {/* Image Section - 4:3 Aspect Ratio based on modern trends, or Square if preferred. Let's go 4:3 */}
            <div className="relative aspect-[4/3] w-full bg-slate-50 overflow-hidden">
                {recipe.image_url ? (
                    <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ChefHat className="h-12 w-12 opacity-50" />
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1">
                {/* Title & Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900 leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1">
                        {recipe.title}
                    </h3>

                    <div className="flex flex-col items-end gap-2 z-20 relative">
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 transition-opacity">
                            <Link href={`/recipes/${recipe.id}/print`} target="_blank">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/5">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                            <Link href={`/recipes/${recipe.id}/edit`}>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/5">
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                            {onDelete && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(e);
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>

                        {/* Allergens / Diets */}
                        <div className="flex flex-wrap justify-end gap-1">
                            {recipe.recipe_tags?.filter(t => t.dietary_tags?.type === 'allergen').map(t => {
                                if (!t.dietary_tags) return null;
                                const Icon = getIconForTag(t.dietary_tags.name, 'allergen');
                                if (!Icon) return null;
                                return (
                                    <Tooltip key={t.tag_id}>
                                        <TooltipTrigger asChild>
                                            <div className="p-1 rounded-full bg-orange-50 text-orange-500">
                                                <Icon className="h-3 w-3" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{t.dietary_tags.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}

                            {allDiets
                                .filter(d => !recipe.recipe_tags?.some(rt => rt.tag_id === d.id))
                                .map(diet => {
                                    const Icon = getIconForTag(diet.name, 'diet');
                                    return (
                                        <Tooltip key={diet.id}>
                                            <TooltipTrigger asChild>
                                                <div className="p-1 rounded-full bg-red-50 text-red-500 opacity-70">
                                                    {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="h-2 w-2 bg-red-500 rounded-full block m-0.5" />}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Incompatible: {diet.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })
                            }
                        </div>
                    </div>
                </div>

                {/* Rating - Compact */}
                <div className="mb-3">
                    {recipe.rating ? (
                        <StarRating value={recipe.rating} readOnly size={14} />
                    ) : (
                        <span className="text-xs text-slate-400 italic">Non noté</span>
                    )}
                </div>

                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-sm text-slate-500">
                    {/* Time */}
                    <div className="flex items-center gap-1.5" title="Temps total">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{totalTime > 0 ? `${totalTime} min` : '-'}</span>
                    </div>

                    {/* Cost */}
                    <div className="flex items-center gap-1.5" title="Coût total">
                        <Euro className="h-3.5 w-3.5 text-slate-400" />
                        <span>{(recipe.total_cost || 0) > 0 ? `${Number(recipe.total_cost).toFixed(2)}` : '-'}</span>
                    </div>

                    {/* Servings */}
                    <div className="flex items-center gap-1.5" title="Couverts">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{recipe.base_servings}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
