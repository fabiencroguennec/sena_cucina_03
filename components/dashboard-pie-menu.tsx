"use client";

import { PieMenu } from "@/components/ui/pie-menu";
import { ChefHat, Plus, ShoppingBasket, CalendarDays, ClipboardList } from "lucide-react";

export function DashboardPieMenu() {
    const actions = [
        {
            title: "Nouvelle Recette",
            href: "/recipes/new",
            icon: Plus,
            color: "bg-emerald-100 text-emerald-700",
            description: "Ajouter une nouvelle création",
        },
        {
            title: "Mes Recettes",
            href: "/recipes",
            icon: ChefHat,
            color: "bg-orange-100 text-orange-700",
            description: "Voir toutes les fiches techniques",
        },
        {
            title: "Ingrédients",
            href: "/ingredients",
            icon: ShoppingBasket,
            color: "bg-blue-100 text-blue-700",
            description: "Gérer le stock et les prix",
        },
        {
            title: "Menus",
            href: "/menus",
            icon: CalendarDays,
            color: "bg-purple-100 text-purple-700",
            description: "Planifier les retraites",
        },
        {
            title: "Listes de Courses",
            href: "/shopping-list",
            icon: ClipboardList,
            color: "bg-yellow-100 text-yellow-700",
            description: "Vos achats groupés",
        },
    ];

    return <PieMenu items={actions} />;
}
