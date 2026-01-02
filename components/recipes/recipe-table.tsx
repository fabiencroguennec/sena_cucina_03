
"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowUpDown, MoreHorizontal, Utensils, Clock, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StarRating } from "@/components/ui/star-rating";

// Quick type def matching the one in recipe-list usually
interface RecipeTableProps {
    recipes: any[]; // using any or the full type to avoid strictness issues for now, or match RecipeWithTags
    onDelete: (id: string) => void;
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
};

export function RecipeTable({ recipes, onDelete }: RecipeTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'title', direction: 'asc' });

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedRecipes = [...recipes].sort((a, b) => {
        const { key, direction } = sortConfig;
        let aVal = a[key];
        let bVal = b[key];

        // Specific handling for derived values
        if (key === 'time') {
            aVal = (a.prep_time || 0) + (a.cook_time || 0);
            bVal = (b.prep_time || 0) + (b.cook_time || 0);
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[80px]"></TableHead>
                        <TableHead className="w-[30%]">
                            <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => handleSort('title')}>
                                Recette
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>
                            <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => handleSort('time')}>
                                <Clock className="mr-2 h-4 w-4" /> Durée
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => handleSort('rating')}>
                                <Star className="mr-2 h-4 w-4" /> Note
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRecipes.map((recipe) => (
                        <TableRow key={recipe.id} className="hover:bg-slate-50/50">
                            <TableCell>
                                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-slate-100">
                                    {recipe.image_url ? (
                                        <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                                            <Utensils className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">
                                <Link href={`/recipes/${recipe.id}`} className="hover:underline text-slate-900 group-hover:text-primary transition-colors">
                                    {recipe.title}
                                </Link>
                                {recipe.description && (
                                    <p className="text-slate-500 text-xs truncate max-w-[200px]">{recipe.description}</p>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {recipe.recipe_tags
                                        ?.filter((t: any) => t.dietary_tags?.type === 'category')
                                        .map((t: any) => (
                                            <Badge key={t.tag_id} variant="secondary" className="text-xs font-normal">
                                                {t.dietary_tags?.name}
                                            </Badge>
                                        ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm text-slate-600 font-medium">
                                    {((recipe.prep_time || 0) + (recipe.cook_time || 0)) > 0 ? `${(recipe.prep_time || 0) + (recipe.cook_time || 0)} min` : '-'}
                                </div>
                            </TableCell>
                            <TableCell>
                                <StarRating value={recipe.rating || 0} size={14} readOnly />
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <Link href={`/recipes/${recipe.id}`}>
                                            <DropdownMenuItem>Voir la fiche</DropdownMenuItem>
                                        </Link>
                                        <Link href={`/recipes/${recipe.id}/edit`}>
                                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(recipe.id)}>
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
