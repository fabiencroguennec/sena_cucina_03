"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChefHat, ShoppingBasket, CalendarDays, Settings, Sparkles } from "lucide-react";
import { DirectoryDialog } from "@/components/suppliers/directory-dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAssistantMode } from "@/components/assistant-context";

export function Navbar() {
    const { isAssistantMode, toggleAssistantMode } = useAssistantMode();

    const routes = [
        { href: "/calendar", label: "Calendrier", icon: CalendarDays },
        { href: "/recipes", label: "Recettes", icon: ChefHat },
        { href: "/ingredients", label: "Ingrédients", icon: ShoppingBasket },
        // Settings moved to separate area
    ];

    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-20 items-center justify-between px-4 md:px-8">
                {/* Logo / Brand */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-serif text-2xl font-bold tracking-tight text-primary hidden md:inline-block">
                        Sena Cucina
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className="text-base font-medium text-slate-600 transition-colors hover:text-primary flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50"
                            title={route.label}
                        >
                            <route.icon className="h-5 w-5" />
                            {route.label}
                        </Link>
                    ))}

                    {/* Right Side Icons: Directory | Settings | Assistant */}
                    <div className="ml-2 pl-4 border-l border-slate-200 flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div><DirectoryDialog /></div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-slate-900 text-white border-none">
                                    <p className="font-medium">Répertoire Fournisseurs</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href="/settings">
                                            <Settings className="h-5 w-5 text-slate-500" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-slate-900 text-white border-none">
                                    <p className="font-medium">Paramètres</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center h-10 w-10">
                                        <Switch
                                            checked={isAssistantMode}
                                            onCheckedChange={toggleAssistantMode}
                                            className="data-[state=checked]:bg-indigo-600 scale-90"
                                            aria-label="Mode Assistant"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs bg-slate-900 text-white border-none">
                                    <p className="font-medium flex items-center gap-2">
                                        <Sparkles className="h-3 w-3 text-indigo-400" />
                                        Mode Assistant
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Laissez-vous guider lors de la création de vos recettes ou événements.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </nav>

                {/* Mobile Nav Trigger */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12">
                                <Menu className="h-8 w-8" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle className="sr-only">Menu de Navigation</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-6 mt-8">
                                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center space-x-2 mb-4">
                                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <ChefHat className="h-6 w-6 text-primary" />
                                    </div>
                                    <span className="font-serif text-2xl font-bold tracking-tight text-primary">
                                        Sena Cucina
                                    </span>
                                </Link>
                                <nav className="flex flex-col gap-4">
                                    {routes.map((route) => (
                                        <Link
                                            key={route.href}
                                            href={route.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-slate-600 transition-colors hover:text-primary hover:bg-slate-50 rounded-md"
                                        >
                                            <route.icon className="h-6 w-6" />
                                            {route.label}
                                        </Link>
                                    ))}

                                    <div className="px-2 py-3 flex items-center gap-4">
                                        <DirectoryDialog />
                                        <span className="text-lg font-medium text-slate-600">Répertoire</span>
                                    </div>

                                    <Link
                                        href="/settings"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-slate-600 transition-colors hover:text-primary hover:bg-slate-50 rounded-md"
                                    >
                                        <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-transparent">
                                            <Settings className="h-5 w-5 text-slate-500" />
                                        </Button>
                                        <span className="text-lg font-medium text-slate-600">Paramètres</span>
                                    </Link>

                                    <div className="flex items-center justify-between px-2 py-3 text-lg font-medium text-slate-600 rounded-md hover:bg-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 flex items-center justify-center">
                                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                            </div>
                                            <span>Assistant</span>
                                        </div>
                                        <Switch
                                            checked={isAssistantMode}
                                            onCheckedChange={toggleAssistantMode}
                                            className="data-[state=checked]:bg-indigo-600"
                                        />
                                    </div>

                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

