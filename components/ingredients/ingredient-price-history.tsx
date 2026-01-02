"use client";

import { useEffect, useState } from "react";
import { getIngredientPriceHistory } from "@/lib/api/ingredients";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface IngredientPriceHistoryProps {
    ingredientId: string;
}

export function IngredientPriceHistory({ ingredientId }: IngredientPriceHistoryProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getIngredientPriceHistory(ingredientId).then(setHistory).finally(() => setLoading(false));
    }, [ingredientId]);

    if (loading) return <div className="text-center p-4 text-sm text-slate-500">Chargement de l'historique...</div>;

    if (history.length === 0) return (
        <div className="text-center p-8 border border-dashed rounded-lg text-slate-400">
            Aucun historique d'achat pour cet ingrédient.
        </div>
    );

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                Historique des Prix & Qualité
            </h3>

            <div className="border rounded-md overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Date</TableHead>
                            <TableHead>Événement</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Prix Achat</TableHead>
                            <TableHead className="text-right">Prix Unitaire</TableHead>
                            <TableHead className="text-center w-[100px]">Qualité</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((item) => {
                            const date = item.purchase_date || item.events?.start_date || item.created_at;
                            // Calculate unit price if override exists, else calculate
                            const unitPrice = item.price_per_unit_override || (item.price_paid && item.quantity_bought ? item.price_paid / item.quantity_bought : null);

                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="text-sm text-slate-600">
                                        {date ? format(new Date(date), "d MMM yyyy", { locale: fr }) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {item.events ? (
                                            <Link href={`/calendar/${item.events.id}`} className="hover:underline text-indigo-600 font-medium">
                                                {item.events.title}
                                            </Link>
                                        ) : (
                                            <span className="text-slate-400 italic">Inconnu</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {item.suppliers?.name || <span className="text-slate-400">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {item.price_paid ? (
                                            <span className="font-medium text-slate-900">
                                                {item.price_paid}€ <span className="text-slate-400 font-normal text-xs">pour {item.quantity_bought}{item.unit_bought}</span>
                                            </span>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {unitPrice ? (
                                            <Badge variant="outline" className="font-mono">
                                                {unitPrice.toFixed(2)}€ /{item.unit}
                                            </Badge>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {item.quality_rating > 0 ? (
                                            <div className="flex items-center justify-center gap-0.5">
                                                <span className="font-bold text-amber-500">{item.quality_rating}</span>
                                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
