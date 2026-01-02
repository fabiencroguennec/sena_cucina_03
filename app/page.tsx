import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Plus, ShoppingBasket, CalendarDays, ClipboardList } from "lucide-react";

export default function Home() {
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

  return (
    <div className="space-y-8">
      <section className="text-center py-10 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900">
          Bienvenue en Cuisine
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Simplifiez la gestion de vos retraites et séminaires.
          Tout est prêt pour cuisiner de grands moments.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className={`p-6 rounded-full ${action.color}`}>
                  <action.icon className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">{action.title}</h3>
                  <p className="text-slate-500 font-medium">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

