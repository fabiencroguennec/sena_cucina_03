"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useWatch, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormField as FormFieldOriginal, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Event } from "@/lib/types/calendar";
import { ImageUpload } from "@/components/ui/image-upload";
import { TagSelector, TagOption } from "@/components/ui/tag-selector";
import { getAllergens } from "@/lib/api/allergens";
import { ChevronRight, ChevronLeft, X, Check, Loader2, Calendar as CalendarIcon, Users, Building, Phone, Mail, User, Info, Utensils, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

// --- Constants ---
const PASTEL_COLORS = [
    { name: "Bleu Pastel", value: "#BFDBFE" },
    { name: "Vert Pastel", value: "#BBF7D0" },
    { name: "Jaune Pastel", value: "#FEF08A" },
    { name: "Orange Pastel", value: "#FED7AA" },
    { name: "Rouge Pastel", value: "#FECACA" },
    { name: "Violet Pastel", value: "#DDD6FE" },
    { name: "Gris Pastel", value: "#E2E8F0" },
];

const COMMON_DIETS = [
    "Végétarien", "Végétalien", "Sans Gluten", "Sans Lactose", "Halal", "Casher", "Sans Porc", "Sans Arachide"
];

// --- Schema ---
const eventSchema = z.object({
    title: z.string().min(2, "Le titre est requis"),
    start_date: z.string().min(1, "Date de début requise"),
    end_date: z.string().min(1, "Date de fin requise"),
    image_url: z.string().optional(),

    // Client
    company_name: z.string().optional(),
    contact_name: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().email("Email invalide").optional().or(z.literal("")),

    // Audience
    guest_count: z.number().min(1, "Au moins 1 convive"),
    diets: z.record(z.string(), z.number()).default({}),
    allergens: z.array(z.string()).default([]),

    // Logistics
    color: z.string().default("#BFDBFE"),
    notes: z.string().optional(),
    selling_price: z.number().optional().default(0),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventWizardProps {
    onClose: () => void;
    onSubmit: (data: Partial<Event>) => Promise<void>;
    initialData?: Partial<Event>;
}

export function EventWizard({ onClose, onSubmit, initialData }: EventWizardProps) {
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    // Updated Steps
    const steps = ["Identité", "Calendrier", "Hôte", "Audience", "Logistique", "Révision"];

    const [allergenOptions, setAllergenOptions] = useState<TagOption[]>([]);

    useEffect(() => {
        getAllergens().then(tags => tags && setAllergenOptions(tags.map(t => ({ label: t.name, value: t.name }))));
    }, []);

    const form = useForm<EventFormValues>({
        // @ts-ignore - resolver type mismatch due to complex schema
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: initialData?.title || "",
            start_date: initialData?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            end_date: initialData?.end_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            image_url: initialData?.image_url || "",
            company_name: initialData?.company_name || "",
            contact_name: initialData?.contact_name || "",
            contact_phone: initialData?.contact_phone || "",
            contact_email: initialData?.contact_email || "",
            guest_count: initialData?.guest_count || 30,
            diets: initialData?.diets || {},
            allergens: initialData?.allergens || [],
            color: initialData?.color || PASTEL_COLORS[0].value,
            notes: initialData?.notes || "",
            selling_price: initialData?.selling_price || 0,
        }
    });

    const watchedDiets = useWatch({ control: form.control, name: "diets" });
    const watchedTitle = useWatch({ control: form.control, name: "title" });
    const watchedGuestCount = useWatch({ control: form.control, name: "guest_count" });



    // Watch dates for Calendar sync
    const startDateStr = useWatch({ control: form.control, name: "start_date" });
    const endDateStr = useWatch({ control: form.control, name: "end_date" });

    // Toggle for single/multi day
    const [isMultiDay, setIsMultiDay] = useState(false);

    // Sync end date if single day
    useEffect(() => {
        if (!isMultiDay && startDateStr) {
            form.setValue("end_date", startDateStr);
        }
    }, [startDateStr, isMultiDay, form]);

    const canNext = () => {
        if (currentStep === 0) return !!form.watch("title"); // Step 1: Just title
        if (currentStep === 1) return !!form.watch("start_date") && !!form.watch("end_date"); // Step 2: Dates
        return true;
    };

    const goNext = () => {
        if (canNext() && currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    };

    const goBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
        else onClose();
    };

    const handleSubmit: SubmitHandler<EventFormValues> = async (data) => {
        setLoading(true);
        try {
            await onSubmit(data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <Button variant="ghost" size="icon" onClick={goBack} className="text-slate-400 hover:text-slate-900 -ml-2 rounded-full">
                        {currentStep === 0 ? <X className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                    </Button>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">{steps[currentStep]}</span>
                        {watchedTitle && (
                            <span className="text-sm font-medium text-slate-500 truncate max-w-[150px] md:max-w-[300px] leading-tight mt-0.5 mb-1.5">
                                {watchedTitle}
                            </span>
                        )}
                        <div className={cn("flex gap-1.5 justify-center", !watchedTitle && "mt-2")}>
                            {steps.map((_, i) => (
                                <div key={i} className={cn("h-1 rounded-full transition-all duration-300",
                                    i === currentStep ? "bg-indigo-600 w-8" :
                                        i < currentStep ? "bg-indigo-900/20 w-2" : "bg-slate-100 w-2"
                                )} />
                            ))}
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={onClose} className={cn("-mr-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100")}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30">
                    <div className="max-w-3xl mx-auto px-6 pt-2 pb-10 min-h-full flex flex-col">

                        {/* TOP NAVIGATION (Mobile Friendly) */}
                        <div className="flex items-center justify-between mb-2 sticky top-0 z-10 py-2 bg-slate-50/50 backdrop-blur-sm -mx-6 px-6">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goBack}
                                disabled={currentStep === 0}
                                className={cn("rounded-full h-12 w-12 border-2 border-slate-200 bg-white shadow-sm text-slate-400 hover:text-slate-600",
                                    currentStep === 0 && "opacity-0 pointer-events-none"
                                )}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>

                            <Button
                                size="icon"
                                onClick={goNext}
                                disabled={!canNext()}
                                className={cn("rounded-full h-12 w-12 bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl text-white",
                                    currentStep === steps.length - 1 && "opacity-0 pointer-events-none"
                                )}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="flex-1 flex flex-col justify-start pt-8">

                            {/* STEP 1: IDENTITY */}
                            {currentStep === 0 && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                                    <div className="space-y-4">
                                        <FormField control={form.control} name="title" render={({ field }) => (
                                            <Input
                                                placeholder="Nom de l'événement"
                                                {...field}
                                                className="text-center text-4xl md:text-5xl font-serif font-bold p-0 border-none shadow-none focus-visible:ring-0 placeholder:text-slate-200 text-slate-900 h-auto bg-transparent py-4"
                                                autoFocus
                                            />
                                        )} />
                                        <p className="text-sm text-slate-400 font-medium uppercase tracking-wide">Le Concept</p>
                                    </div>

                                    <div className="max-w-sm mx-auto">
                                        <FormField control={form.control} name="image_url" render={({ field }) => (
                                            <ImageUpload
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                onRemove={() => field.onChange("")}
                                                className="aspect-[21/9] w-full rounded-2xl shadow-lg border-4 border-white bg-slate-100"
                                            />
                                        )} />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: DATES (Alternative UI) */}
                            {currentStep === 1 && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center">
                                    <div className="text-center">
                                        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Les Dates</h2>
                                        <p className="text-slate-500">Quand se déroule l'événement ?</p>
                                    </div>

                                    <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setIsMultiDay(!isMultiDay)}>
                                        <Checkbox
                                            id="multi-day-mode"
                                            checked={isMultiDay}
                                            onCheckedChange={(c) => setIsMultiDay(!!c)}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <label
                                            htmlFor="multi-day-mode"
                                            className="text-sm font-medium leading-none cursor-pointer text-slate-700"
                                        >
                                            Événement sur plusieurs jours
                                        </label>
                                    </div>

                                    <div className={cn("w-full max-w-md grid gap-6 transition-all duration-300", isMultiDay ? "grid-cols-2" : "grid-cols-1")}>
                                        <FormField control={form.control} name="start_date" render={({ field }) => (
                                            <div className="space-y-2">
                                                <FormLabel className="text-xs uppercase font-bold text-slate-400">
                                                    {isMultiDay ? "Début" : "Date"}
                                                </FormLabel>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    className="h-14 rounded-xl border-slate-200 text-lg font-medium px-4 bg-white shadow-sm focus:border-indigo-500 transition-colors"
                                                />
                                            </div>
                                        )} />

                                        {isMultiDay && (
                                            <FormField control={form.control} name="end_date" render={({ field }) => (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                                    <FormLabel className="text-xs uppercase font-bold text-slate-400">Fin</FormLabel>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        className="h-14 rounded-xl border-slate-200 text-lg font-medium px-4 bg-white shadow-sm focus:border-indigo-500 transition-colors"
                                                    />
                                                </div>
                                            )} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: HOST (CLIENT) */}
                            {currentStep === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">L'Hôte</h2>
                                        <p className="text-slate-500">Pour qui cuisinons-nous ?</p>
                                    </div>

                                    <Card className="border-none shadow-xl bg-white max-w-lg mx-auto overflow-hidden relative">
                                        <div className="h-2 bg-indigo-500 w-full absolute top-0 left-0" />
                                        <CardContent className="p-8 space-y-6 pt-10">
                                            <FormField control={form.control} name="company_name" render={({ field }) => (
                                                <div className="flex items-center gap-4 group">
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 group-focus-within:bg-indigo-50 transition-colors">
                                                        <Building className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <FormLabel className="text-xs uppercase font-bold text-slate-400">Organisation</FormLabel>
                                                        <Input {...field} placeholder="Nom de l'entreprise..." className="border-none shadow-none p-0 h-auto text-lg font-medium focus-visible:ring-0 placeholder:text-slate-200" />
                                                    </div>
                                                </div>
                                            )} />

                                            <div className="h-px bg-slate-100 w-full" />

                                            <FormField control={form.control} name="contact_name" render={({ field }) => (
                                                <div className="flex items-center gap-4 group">
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 group-focus-within:bg-indigo-50 transition-colors">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <FormLabel className="text-xs uppercase font-bold text-slate-400">Contact</FormLabel>
                                                        <Input {...field} placeholder="Prénom Nom" className="border-none shadow-none p-0 h-auto text-lg font-medium focus-visible:ring-0 placeholder:text-slate-200" />
                                                    </div>
                                                </div>
                                            )} />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="contact_phone" render={({ field }) => (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            <FormLabel className="text-xs uppercase font-bold text-slate-400">Tel</FormLabel>
                                                        </div>
                                                        <Input {...field} placeholder="+33..." className="bg-slate-50 border-transparent focus:bg-white transition-colors" />
                                                    </div>
                                                )} />
                                                <FormField control={form.control} name="contact_email" render={({ field }) => (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Mail className="h-3 w-3 text-slate-400" />
                                                            <FormLabel className="text-xs uppercase font-bold text-slate-400">Email</FormLabel>
                                                        </div>
                                                        <Input {...field} type="email" placeholder="@..." className="bg-slate-50 border-transparent focus:bg-white transition-colors" />
                                                    </div>
                                                )} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* STEP 4: AUDIENCE */}
                            {currentStep === 3 && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="text-center">
                                        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">L'Audience</h2>
                                        <p className="text-slate-500">Combien sont-ils ?</p>
                                    </div>

                                    <div className="text-center space-y-6">
                                        <div className="inline-flex items-center justify-center gap-6 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => form.setValue("guest_count", Math.max(1, (form.getValues("guest_count") || 0) - 1))}
                                                className="h-16 w-16 rounded-full border-2"
                                            >
                                                <span className="text-2xl">-</span>
                                            </Button>
                                            <div className="min-w-[120px]">
                                                <FormField control={form.control} name="guest_count" render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        className="text-center text-6xl font-bold border-none shadow-none h-auto p-0 focus-visible:ring-0 text-slate-900 appearance-none m-0"
                                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                                    />
                                                )} />
                                                <p className="text-slate-400 font-medium mt-2">CONVIVES</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => form.setValue("guest_count", (form.getValues("guest_count") || 0) + 1)}
                                                className="h-16 w-16 rounded-full border-2"
                                            >
                                                <span className="text-2xl">+</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Card className="border-none shadow-sm bg-indigo-50/50">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Utensils className="h-4 w-4" /></div>
                                                    <h3 className="font-bold text-indigo-900">Régimes Spéciaux</h3>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {COMMON_DIETS.map(diet => {
                                                        const count = watchedDiets[diet] || 0;
                                                        return (
                                                            <div key={diet} className={cn("flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer", count > 0 ? "bg-white border-indigo-200 shadow-sm" : "bg-transparent border-transparent hover:bg-white/50")} onClick={() => {
                                                                const current = form.getValues(`diets.${diet}`) || 0;
                                                                form.setValue(`diets.${diet}`, current > 0 ? 0 : 1);
                                                            }}>
                                                                <span className={cn("text-sm font-medium", count > 0 ? "text-indigo-900" : "text-slate-500")}>{diet}</span>
                                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                                    {count > 0 && (
                                                                        <input
                                                                            type="number"
                                                                            className="w-10 text-right bg-transparent border-b border-indigo-200 text-indigo-600 font-bold focus:outline-none text-sm"
                                                                            value={count}
                                                                            onChange={(e) => {
                                                                                const val = parseInt(e.target.value) || 0;
                                                                                const newDiets = { ...form.getValues("diets") };
                                                                                if (val === 0) delete newDiets[diet];
                                                                                else newDiets[diet] = val;
                                                                                form.setValue("diets", newDiets);
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-sm bg-red-50/50">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><Flag className="h-4 w-4" /></div>
                                                    <h3 className="font-bold text-red-900">Interdictions (Allergies)</h3>
                                                </div>
                                                <FormField control={form.control} name="allergens" render={({ field }) => (
                                                    <TagSelector
                                                        selected={field.value || []}
                                                        options={allergenOptions}
                                                        onChange={field.onChange}
                                                        placeholder="Ajouter une allergie..."
                                                    />
                                                )} />
                                                <p className="text-xs text-red-700/60 mt-2">
                                                    Ces allergènes seront strictement exclus de tous les menus de l'événement.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: LOGISTICS */}
                            {currentStep === 4 && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="text-center">
                                        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Logistique</h2>
                                        <p className="text-slate-500">Détails d'organisation</p>
                                    </div>

                                    <div className="max-w-xl mx-auto space-y-8">
                                        <div className="space-y-4 text-center">
                                            <FormLabel className="text-xs uppercase font-bold text-slate-400">Couleur d'Organisation</FormLabel>
                                            <div className="flex justify-center flex-wrap gap-4">
                                                {PASTEL_COLORS.map(c => (
                                                    <FormField key={c.value} control={form.control} name="color" render={({ field }) => (
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange(c.value)}
                                                            className={cn(
                                                                "w-12 h-12 rounded-full border-4 transition-all shadow-sm",
                                                                field.value === c.value ? "border-slate-900 scale-110" : "border-white hover:scale-105"
                                                            )}
                                                            style={{ backgroundColor: c.value }}
                                                            title={c.name}
                                                        />
                                                    )} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <FormLabel className="text-xs uppercase font-bold text-slate-400 block text-center">Briefing & Notes</FormLabel>
                                            <FormField control={form.control} name="notes" render={({ field }) => (
                                                <div className="relative">
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Détails logistiques, code d'entrée, préférences spécifiques..."
                                                        className="min-h-[200px] bg-[#fdfbf7] border-slate-200 text-lg leading-relaxed resize-none shadow-sm rounded-xl p-6 font-serif text-slate-700 placeholder:text-slate-300 focus-visible:ring-indigo-500/20"
                                                    />
                                                    <div className="absolute top-0 right-0 p-2 opacity-50 pointer-events-none">
                                                        <Info className="h-5 w-5 text-slate-300" />
                                                    </div>
                                                </div>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 6: REVIEW */}
                            {currentStep === 5 && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-serif font-bold text-indigo-900">Tout est bon ?</h2>
                                        <p className="text-slate-500 text-lg">Confirmez la création de l'événement.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                        {/* Card 1: Identity */}
                                        {form.watch("image_url") ? (
                                            <div className="col-span-1 md:col-span-3 h-48 rounded-2xl bg-cover bg-center shadow-md relative overflow-hidden group" style={{ backgroundImage: `url(${form.watch("image_url")})` }}>
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                                <div className="absolute bottom-0 left-0 p-6 text-white">
                                                    <h3 className="font-serif text-3xl font-bold">{form.watch("title")}</h3>
                                                    <p className="opacity-90">
                                                        {new Date(form.watch("start_date") || "").toLocaleDateString('fr-FR')} - {new Date(form.watch("end_date") || "").toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <Card className="bg-slate-900 text-white border-none shadow-md">
                                                <CardContent className="p-6 flex flex-col justify-between h-full min-h-[160px]">
                                                    <div>
                                                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">L'Événement</p>
                                                        <h3 className="font-serif text-2xl font-bold">{form.watch("title")}</h3>
                                                    </div>
                                                    <p className="text-slate-400">
                                                        {new Date(form.watch("start_date") || "").toLocaleDateString('fr-FR')}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card className="border-none shadow-sm bg-white">
                                            <CardContent className="p-6">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">L'Hôte</p>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-lg text-slate-900">{form.watch("company_name") || "Particulier"}</p>
                                                    <p className="text-slate-500 text-sm">{form.watch("contact_name")}</p>
                                                    {form.watch("contact_email") && <p className="text-xs text-indigo-600">{form.watch("contact_email")}</p>}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-sm bg-white">
                                            <CardContent className="p-6">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Le Volume</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-slate-900">{watchedGuestCount}</span>
                                                    <span className="text-slate-500 font-medium">convives</span>
                                                </div>
                                                {Object.keys(watchedDiets).length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-3">
                                                        {Object.entries(watchedDiets).map(([d, c]) => (
                                                            <Badge key={d} variant="secondary" className="text-[10px] px-1.5 h-5">{c} {d.substring(0, 3)}.</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="pt-8">
                                        <Button size="lg" className="rounded-full px-12 h-14 text-lg bg-slate-900 hover:bg-slate-800 shadow-xl hover:shadow-2xl transition-all hover:scale-105 group" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
                                            {loading ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : <Check className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />}
                                            Créer l'Événement
                                        </Button>
                                        <p className="mt-4 text-xs text-slate-400">En cliquant, l'événement sera créé et vous pourrez commencer les menus.</p>
                                    </div>
                                </div>
                            )}

                            {/* NAVIGATION FOOTER */}
                        </div>
                        <div className="h-12" /> {/* Spacer for bottom scroll */}
                    </div>
                </div>
            </div>
        </Form>
    );
}
