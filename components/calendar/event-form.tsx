"use client";

import { useState, useEffect } from "react";
import { Event } from "@/lib/types/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EventFormProps {
    initialData?: Partial<Event>;
    onSubmit: (data: Partial<Event>) => void;
    onCancel: () => void;
}

const PASTEL_COLORS = [
    { name: "Bleu Pastel", value: "#BFDBFE" }, // blue-200
    { name: "Vert Pastel", value: "#BBF7D0" }, // green-200
    { name: "Jaune Pastel", value: "#FEF08A" }, // yellow-200
    { name: "Orange Pastel", value: "#FED7AA" }, // orange-200
    { name: "Rouge Pastel", value: "#FECACA" }, // red-200
    { name: "Violet Pastel", value: "#DDD6FE" }, // violet-200
    { name: "Rose Pastel", value: "#FBCFE8" }, // pink-200
    { name: "Gris Pastel", value: "#E2E8F0" }, // slate-200
];

const COUNTRY_CODES = [
    { code: "FR", dial: "+33", flag: "🇫🇷" },
    { code: "IT", dial: "+39", flag: "🇮🇹" },
    { code: "ES", dial: "+34", flag: "🇪🇸" },
    { code: "UK", dial: "+44", flag: "🇬🇧" },
    { code: "US", dial: "+1", flag: "🇺🇸" },
    { code: "CH", dial: "+41", flag: "🇨🇭" },
    { code: "BE", dial: "+32", flag: "🇧🇪" },
];

const COMMON_DIETS = [
    "Végétarien", "Végétalien", "Sans Gluten", "Sans Lactose", "Halal", "Casher", "Sans Porc", "Sans Arachide"
];

import { getAllergens, Allergen } from "@/lib/api/allergens";

export function EventForm({ initialData, onSubmit, onCancel }: EventFormProps) {
    const [color, setColor] = useState(initialData?.color || PASTEL_COLORS[0].value);

    // System Allergens for Autocomplete
    const [systemAllergens, setSystemAllergens] = useState<Allergen[]>([]);
    useEffect(() => {
        getAllergens().then(setSystemAllergens).catch(console.error);
    }, []);

    // Diets State: Array of { name, count }
    const [diets, setDiets] = useState<{ name: string, count: number }[]>(
        initialData?.diets ? Object.entries(initialData.diets).map(([k, v]) => ({ name: k, count: v })) : []
    );
    const [newDietName, setNewDietName] = useState(COMMON_DIETS[0]);
    const [newDietCount, setNewDietCount] = useState(1);

    // Allergens State
    const [allergens, setAllergens] = useState<string[]>(initialData?.allergens || []);
    const [newAllergen, setNewAllergen] = useState("");

    // Phone State
    const [countryCode, setCountryCode] = useState("+33");
    const [phoneSuffix, setPhoneSuffix] = useState(initialData?.contact_phone?.replace(/^\+\d+\s?/, '') || "");

    const handleAddDiet = () => {
        if (diets.some(d => d.name === newDietName)) return; // Prevent duplicates
        setDiets([...diets, { name: newDietName, count: newDietCount }]);
    };

    const handleRemoveDiet = (name: string) => {
        setDiets(diets.filter(d => d.name !== name));
    };

    const handleAddAllergen = () => {
        if (!newAllergen.trim()) return;
        if (allergens.includes(newAllergen.trim())) return;
        setAllergens([...allergens, newAllergen.trim()]);
        setNewAllergen("");
    };

    const handleRemoveAllergen = (name: string) => {
        setAllergens(allergens.filter(a => a !== name));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Construct Diets Object
        const dietsObj: Record<string, number> = {};
        diets.forEach(d => dietsObj[d.name] = d.count);

        // Construct Phone
        const fullPhone = phoneSuffix ? `${countryCode} ${phoneSuffix}` : "";

        const eventData: Partial<Event> = {
            title: formData.get("title") as string,
            start_date: formData.get("start_date") as string,
            end_date: formData.get("end_date") as string,
            guest_count: parseInt(formData.get("guest_count") as string) || 0,
            company_name: formData.get("company_name") as string,
            image_url: formData.get("image_url") as string,
            contact_name: formData.get("contact_name") as string,
            contact_email: formData.get("contact_email") as string,
            contact_phone: fullPhone,
            notes: formData.get("notes") as string,
            selling_price: parseFloat(formData.get("selling_price") as string) || 0,
            color,
            allergens,
            diets: dietsObj
        };

        onSubmit(eventData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">

            {/* 1. General Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b pb-1">Général</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Nom de l'événement *</Label>
                        <Input id="title" name="title" defaultValue={initialData?.title} required placeholder="Ex: Mariage Durant" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company_name">Entreprise / Asso</Label>
                        <Input id="company_name" name="company_name" defaultValue={initialData?.company_name} placeholder="Ex: Yoga Club Paris" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Début *</Label>
                        <Input name="start_date" type="date" defaultValue={initialData?.start_date} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Fin *</Label>
                        <Input name="end_date" type="date" defaultValue={initialData?.end_date} required />
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Nombre de convives *</Label>
                        <Input name="guest_count" type="number" min="1" defaultValue={initialData?.guest_count || 10} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Budget / Prix Vente (€)</Label>
                        <Input name="selling_price" type="number" step="0.01" defaultValue={initialData?.selling_price || 0} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <Label>Couleur (Pastel)</Label>
                        <div className="flex gap-2 flex-wrap">
                            {PASTEL_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        color === c.value ? "border-slate-600 scale-110" : "border-transparent hover:scale-105"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="image_url">Image (URL)</Label>
                    <Input id="image_url" name="image_url" defaultValue={initialData?.image_url} placeholder="https://..." />
                </div>
            </div>

            {/* 2. Contact */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b pb-1">Contact</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nom Contact</Label>
                        <Input name="contact_name" defaultValue={initialData?.contact_name} placeholder="Ex: Jean Dupont" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input name="contact_email" type="email" defaultValue={initialData?.contact_email} placeholder="jean@example.com" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRY_CODES.map(c => (
                                    <SelectItem key={c.code} value={c.dial}>
                                        {c.flag} {c.dial}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            value={phoneSuffix}
                            onChange={(e) => setPhoneSuffix(e.target.value)}
                            placeholder="6 12 34 56 78"
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Diets & Allergens */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b pb-1">Régimes & Allergènes</h3>

                {/* Diets */}
                <div className="space-y-2">
                    <Label>Régimes Spéciaux</Label>
                    <div className="flex gap-2">
                        <Select value={newDietName} onValueChange={setNewDietName}>
                            <SelectTrigger className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_DIETS.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            value={newDietCount}
                            onChange={(e) => setNewDietCount(parseInt(e.target.value) || 1)}
                            className="w-20"
                            min="1"
                        />
                        <Button type="button" onClick={handleAddDiet} size="icon" variant="outline">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {diets.map(diet => (
                            <Badge key={diet.name} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-2">
                                {diet.name}: {diet.count}
                                <button type="button" onClick={() => handleRemoveDiet(diet.name)} className="hover:text-red-500">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Allergens */}
                <div className="space-y-2">
                    <Label>Allergènes</Label>
                    <div className="flex gap-2">
                        <Input
                            value={newAllergen}
                            onChange={(e) => setNewAllergen(e.target.value)}
                            placeholder="Ex: Arachides..."
                            list="system-allergens"
                        />
                        <datalist id="system-allergens">
                            {systemAllergens.map(a => (
                                <option key={a.id} value={a.name} />
                            ))}
                        </datalist>
                        <Button type="button" onClick={handleAddAllergen} size="icon" variant="outline">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {allergens.map(a => (
                            <Badge key={a} variant="outline" className="pl-2 pr-1 py-1 flex items-center gap-2 text-red-500 border-red-200 bg-red-50">
                                {a}
                                <button type="button" onClick={() => handleRemoveAllergen(a)} className="hover:text-red-700">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">Remarques</Label>
                <Textarea id="notes" name="notes" defaultValue={initialData?.notes} placeholder="Informations complémentaires..." className="h-20" />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
            </div>
        </form>
    );
}
