"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Copy, Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UNIT_OPTIONS } from "@/lib/validators/ingredient";

interface ShoppingListDialogProps {
    title: string;
    servings: number;
    items: {
        id: string;
        scaledQuantity: number;
        unit: string; // The specific unit used (e.g. from recipe item)
        ingredients?: {
            name: string;
            unit?: string;
        } | null;
    }[];
}

export function ShoppingListDialog({ title, servings, items }: ShoppingListDialogProps) {
    const [open, setOpen] = useState(false);

    const generateListText = () => {
        const header = `Liste de courses : ${title} (${servings} pers.)\n\n`;
        const body = items.map(item => {
            // Priority: Item Unit -> Ingredient Unit -> '-'
            const unitValue = item.unit || item.ingredients?.unit;
            const unitLabel = UNIT_OPTIONS.find(u => u.value === unitValue)?.label || unitValue || '';
            const qty = Number.isInteger(item.scaledQuantity) ? item.scaledQuantity : item.scaledQuantity.toFixed(2);
            return `[ ] ${qty} ${unitLabel} ${item.ingredients?.name || 'Ingrédient'}`;
        }).join('\n');
        return header + body;
    };

    const handleCopy = () => {
        const text = generateListText();
        navigator.clipboard.writeText(text);
        toast.success("Liste copiée dans le presse-papier !");
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Liste de courses : ${title}`);
        const body = encodeURIComponent(generateListText());
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-700 hover:text-primary hover:border-primary/50">
                    <ShoppingBasket className="h-4 w-4" />
                    <span className="hidden sm:inline">Liste de courses</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBasket className="h-5 w-5 text-primary" />
                        Liste de courses ({servings} p.)
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto space-y-2">
                    <p className="text-sm text-slate-500 mb-4">
                        Voici les ingrédients nécessaires pour <strong className="text-slate-900">{title}</strong>.
                    </p>

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2">
                        {items.map(item => {
                            const unitValue = item.unit || item.ingredients?.unit;
                            const unitLabel = UNIT_OPTIONS.find(u => u.value === unitValue)?.label || unitValue || '';
                            const qty = Number.isInteger(item.scaledQuantity) ? item.scaledQuantity : item.scaledQuantity.toFixed(2);

                            return (
                                <div key={item.id} className="flex items-start gap-3 text-sm">
                                    <div className="mt-0.5 h-4 w-4 rounded border border-slate-300 bg-white" />
                                    <span className="text-slate-700">
                                        <span className="font-bold text-slate-900">{qty}{unitLabel ? ` ${unitLabel}` : ''}</span> {item.ingredients?.name}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={handleEmail} className="gap-2">
                        <Mail className="h-4 w-4" />
                        Email / Partager
                    </Button>
                    <Button onClick={handleCopy} className="gap-2">
                        <Copy className="h-4 w-4" />
                        Copier texte
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
