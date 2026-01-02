import { ModeToggle } from "@/components/settings/mode-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Palette } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-100">Paramètres</h1>
                <p className="text-slate-500 dark:text-slate-400">Gérez vos préférences et la configuration de l'application.</p>
            </div>

            <div className="grid gap-6">
                {/* Section Appearance */}
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
                    <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg font-medium">Apparence</CardTitle>
                        </div>
                        <CardDescription>Personnalisez l'interface visuelle de Sena Cucina.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Moon className="w-4 h-4 text-slate-500" />
                                    Mode Sombre
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    Activez le thème sombre pour réduire la fatigue visuelle.
                                </div>
                            </div>
                            <ModeToggle />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
