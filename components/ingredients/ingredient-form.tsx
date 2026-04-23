import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ingredientSchema, IngredientFormValues, UNIT_OPTIONS, CATEGORY_OPTIONS } from "@/lib/validators/ingredient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createIngredient, updateIngredient, Ingredient } from "@/lib/api/ingredients";
import { getTags } from "@/lib/api/tags";
import { useState, useEffect, useRef, ReactNode } from "react";
import { Loader2, Check, ChevronRight, ChevronLeft, X, Plus, Info, ArrowUpDown, Euro, Leaf } from "lucide-react";
import { MultiSelect, MultiOption } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { getIconForCategory, getIconForTag } from "@/lib/ui-utils";
import { useDebounce } from "@/lib/use-debounce";
import { useMediaQuery } from "@/lib/use-media-query";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAssistantMode } from "@/components/assistant-context";

interface IngredientFormProps {
    initialData?: Ingredient;
    onSuccess?: (data: Ingredient) => void;
    onCancel?: () => void;
    priceHistoryNode?: ReactNode;
}

export function IngredientForm({ initialData, onSuccess, onCancel, priceHistoryNode }: IngredientFormProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { isAssistantMode } = useAssistantMode();
    const [currentStep, setCurrentStep] = useState(0);

    const [loading, setLoading] = useState(false); // Global loading (e.g. init)
    // ...
    const [saving, setSaving] = useState(false); // Auto-save status
    const [allergenOptions, setAllergenOptions] = useState<MultiOption[]>([]);
    const [dietOptions, setDietOptions] = useState<MultiOption[]>([]);
    const [internalId, setInternalId] = useState<string | undefined>(initialData?.id);

    // Track last saved state to avoid redundant saves
    const lastSavedRef = useRef<string>("");

    useEffect(() => {
        getTags('allergen').then(tags => {
            if (tags) {
                setAllergenOptions(tags.map((t: any) => ({ label: t.name, value: t.id })));
            }
        }).catch(err => console.error("Failed to load allergens", err));
        getTags('diet').then(tags => {
            if (tags) {
                setDietOptions(tags.map((t: any) => ({ label: t.name, value: t.id })));
            }
        }).catch(err => console.error("Failed to load diets", err));
    }, []);

    const form = useForm<IngredientFormValues>({
        // @ts-ignore - resolver type mismatch due to complex schema
        resolver: zodResolver(ingredientSchema),
        defaultValues: {
            name: initialData?.name || "",
            category: initialData?.category || "",
            price_per_unit: initialData?.price_per_unit || 0,
            unit: initialData?.unit || "kg",
            image_url: initialData?.image_url || "",
            images: (Array.isArray(initialData?.images) ? initialData.images : (initialData?.image_url ? [initialData.image_url] : [])) as string[],
            allergens: initialData?.ingredient_tags?.map(t => t.tag_id) || [],
            incompatible_diets: initialData?.incompatible_diets || [],
            suppliers: [],
        },
    });

    const watchedName = useWatch({ control: form.control, name: "name" });

    // Initialize lastSavedRef with initial values to prevent save on mount
    useEffect(() => {
        if (!lastSavedRef.current) {
            lastSavedRef.current = JSON.stringify(form.getValues());
        }
    }, []);

    // Refresh default values when options load
    useEffect(() => {
        if (initialData && allergenOptions.length > 0) {
            const currentAllergens = form.getValues('allergens');
            if (!currentAllergens || currentAllergens.length === 0) {
                const existingTags = initialData.ingredient_tags?.map(t => t.tag_id).filter(id => allergenOptions.some(opt => opt.value === id));
                if (existingTags && existingTags.length > 0) {
                    form.setValue('allergens', existingTags);
                }
            }
        }
    }, [initialData, allergenOptions, form]);

    // Auto-save logic
    const formValues = form.watch();
    const debouncedValues = useDebounce(formValues, 1000);

    const handleSave = async (dataToSave: any) => {
        setSaving(true);
        try {
            if (!dataToSave.name?.trim()) return null;

            let savedId = internalId;
            if (savedId) {
                await updateIngredient(savedId, dataToSave);
            } else {
                const newIng = await createIngredient(dataToSave);
                if (newIng) {
                    setInternalId(newIng.id);
                    savedId = newIng.id;
                }
            }
            lastSavedRef.current = JSON.stringify(dataToSave);
            return savedId;
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Erreur de sauvegarde");
            return null;
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const currentString = JSON.stringify(debouncedValues);

        // Skip if no change or name is empty
        if (currentString === lastSavedRef.current || !debouncedValues.name) return;

        handleSave(debouncedValues);
    }, [debouncedValues, internalId]);

    // Prevent default form submission
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    if (!initialData && isAssistantMode) {
        // Wizard Mode (Creation)
        const steps = ["Identité", "Catégorie", "Diététique", "Prix"];
        const canNext = () => {
            if (currentStep === 0) return !!form.watch("name");
            return true;
        };

        const goNext = async () => {
            if (!canNext()) return;
            if (currentStep < 3) setCurrentStep(c => c + 1);
            else {
                // Force save latest values before finishing
                const currentValues = form.getValues();
                let finalId = internalId;

                // Save if never saved OR if current values differ from last saved
                if (!finalId || JSON.stringify(currentValues) !== lastSavedRef.current) {
                    const res = await handleSave(currentValues);
                    if (res) finalId = res;
                }

                if (finalId) {
                    const finalData = { ...currentValues, id: finalId } as Ingredient;
                    if (onSuccess) onSuccess(finalData);
                }
            }
        };

        const goBack = () => {
            if (currentStep > 0) setCurrentStep(c => c - 1);
            else onCancel?.();
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
                            {watchedName && (
                                <span className="text-sm font-medium text-slate-500 truncate max-w-[150px] md:max-w-[300px] leading-tight mt-0.5 mb-1.5">
                                    {watchedName}
                                </span>
                            )}
                            <div className={cn("flex gap-1.5 justify-center", !watchedName && "mt-2")}>
                                {steps.map((_, i) => (
                                    <div key={i} className={cn("h-1 rounded-full transition-all duration-300",
                                        i === currentStep ? "bg-slate-900 w-8" :
                                            i < currentStep ? "bg-slate-900/20 w-2" : "bg-slate-100 w-2"
                                    )} />
                                ))}
                            </div>
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => onCancel?.()} className={cn("-mr-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100")}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30">
                        <div className="max-w-3xl mx-auto px-6 pt-8 pb-10 min-h-full flex flex-col justify-start">

                            {/* TOP NAVIGATION */}
                            <div className="flex items-center justify-between mb-8 sticky top-0 z-10">
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
                                    className={cn("rounded-full h-12 w-12 bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl text-white transition-all",
                                        currentStep === 3 ? "bg-emerald-600 hover:bg-emerald-700" : ""
                                    )}
                                >
                                    {currentStep === 3 ? <Check className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                                </Button>
                            </div>

                            <div className="flex flex-col items-center w-full">
                                {currentStep === 0 && (
                                    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="text-center space-y-2">
                                            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">L'Identité</h2>
                                            <p className="text-slate-500">Quel est le nom de cet ingrédient ?</p>
                                        </div>
                                        <div className="text-center space-y-4">
                                            <Input
                                                placeholder="Nom de l'ingrédient"
                                                {...form.register("name")}
                                                className="text-center text-3xl md:text-4xl font-serif font-bold p-0 border-none shadow-none focus-visible:ring-0 placeholder:text-slate-200 text-slate-900 h-auto bg-transparent py-4"
                                                autoFocus
                                            />
                                        </div>
                                        <FormField
                                            control={form.control as any}
                                            name="images"
                                            render={({ field }) => (
                                                <div className="flex justify-center">
                                                    <MultiImageUpload
                                                        value={field.value}
                                                        onChange={(urls) => {
                                                            field.onChange(urls);
                                                            form.setValue('image_url', urls[0] || "");
                                                        }}
                                                        bucket="recipes"
                                                        className="w-48 h-48 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 mx-auto overflow-hidden [&_.grid]:flex [&_.grid]:h-full [&_.grid]:w-full [&_.grid]:items-center [&_.grid]:justify-center [&_.grid]:gap-0 [&_button]:w-full [&_button]:h-full [&_button]:border-none [&_button]:rounded-none [&_button]:hover:bg-slate-100 [&_img]:object-cover"
                                                    />
                                                </div>
                                            )}
                                        />
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Catégorie</h2>
                                            <p className="text-slate-500">Choisissez la famille</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {CATEGORY_OPTIONS.map((opt) => {
                                                const Icon = getIconForCategory(opt.value);
                                                const isSelected = form.watch('category') === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            form.setValue('category', opt.value);
                                                            setTimeout(() => setCurrentStep(2), 150);
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-2 px-4 py-3 rounded-full border text-sm font-medium transition-all duration-200",
                                                            isSelected
                                                                ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {Icon && <Icon className={cn("h-4 w-4", isSelected ? "text-white" : "text-slate-400")} />}
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Spécificités</h2>
                                            <p className="text-slate-500">Allergènes et Régimes</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block text-center">Allergènes Présents</label>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {allergenOptions.map((opt) => {
                                                        const isSelected = (form.watch('allergens') || []).includes(opt.value);
                                                        const Icon = getIconForTag(opt.label, 'allergen');
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    const current = form.getValues('allergens') || [];
                                                                    if (isSelected) form.setValue('allergens', current.filter(v => v !== opt.value));
                                                                    else form.setValue('allergens', [...current, opt.value]);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                                                                    isSelected
                                                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                                                        : "bg-white text-slate-500 border-slate-200"
                                                                )}
                                                            >
                                                                {Icon && <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-orange-600" : "text-slate-400")} />}
                                                                {opt.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="w-12 h-px bg-slate-100 mx-auto" />

                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block text-center">Régimes Incompatibles (Exclus)</label>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {dietOptions.map((opt) => {
                                                        const isSelected = (form.watch('incompatible_diets') || []).includes(opt.value);
                                                        const Icon = getIconForTag(opt.label, 'diet');
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    const current = form.getValues('incompatible_diets') || [];
                                                                    if (isSelected) form.setValue('incompatible_diets', current.filter(v => v !== opt.value));
                                                                    else form.setValue('incompatible_diets', [...current, opt.value]);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                                                                    isSelected
                                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                                        : "bg-white text-slate-500 border-slate-200"
                                                                )}
                                                            >
                                                                {Icon && <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-red-600" : "text-slate-400")} />}
                                                                {opt.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Prix</h2>
                                            <p className="text-slate-500">Prix standard de référence</p>
                                        </div>

                                        <div className="bg-white p-8 space-y-8 rounded-xl shadow-sm border border-slate-100">
                                            <div className="flex items-baseline gap-2 justify-center">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...form.register("price_per_unit")}
                                                    className="text-6xl font-serif font-bold text-center border-none p-0 h-auto w-48 focus-visible:ring-0 text-slate-900 placeholder:text-slate-200"
                                                    placeholder="0"
                                                />
                                                <div className="flex flex-col items-start mb-2">
                                                    <span className="text-2xl text-slate-300 font-serif">€</span>
                                                    <Select
                                                        onValueChange={(v) => form.setValue('unit', v)}
                                                        defaultValue={form.watch("unit")}
                                                    >
                                                        <SelectTrigger className="w-auto min-w-[60px] border-none shadow-none text-sm font-bold text-slate-500 focus:ring-0 p-0 h-auto">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {UNIT_OPTIONS.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>/{opt.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="px-4">
                                                <Slider
                                                    defaultValue={[form.watch('price_per_unit') || 0]}
                                                    max={50}
                                                    step={0.5}
                                                    onValueChange={(vals) => form.setValue('price_per_unit', vals[0])}
                                                    value={[form.watch('price_per_unit') || 0]}
                                                    className="py-4"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Form>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="pb-20 md:pb-0">



                <div className="space-y-4 px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* LEFT COLUMN */}
                        <div className="space-y-4">
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="px-4 pt-2 pb-0"><CardTitle className="text-lg font-serif text-slate-800 flex items-center gap-2"><Info className="h-5 w-5 text-emerald-600" /> Identité</CardTitle></CardHeader>
                                <CardContent className="space-y-4 p-4 pt-0">
                                    <FormField control={form.control as any} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Nom du produit</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nom du produit (Ex: Tomates...)" {...field} className="text-2xl md:text-3xl font-bold font-serif border-x-0 border-t-0 border-b-2 border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-600 bg-transparent placeholder:text-slate-300 h-auto py-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control as any} name="images" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Illustrations</FormLabel>
                                            <FormControl>
                                                <MultiImageUpload value={field.value} onChange={(urls) => { field.onChange(urls); form.setValue('image_url', urls[0] || ""); }} bucket="recipes" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="px-4 pt-2 pb-0"><CardTitle className="text-lg font-serif text-slate-800 flex items-center gap-2"><ArrowUpDown className="h-5 w-5 text-emerald-600" /> Classification</CardTitle></CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <FormField control={form.control as any} name="category" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Catégorie</FormLabel>
                                            <FormControl>
                                                <div className="flex flex-wrap gap-2">
                                                    {CATEGORY_OPTIONS.map((opt) => {
                                                        const Icon = getIconForCategory(opt.value);
                                                        const isSelected = field.value === opt.value;
                                                        return (
                                                            <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                                                                className={cn("flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-all duration-200", isSelected ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50")}
                                                            >
                                                                {Icon && <Icon className={cn("h-4 w-4", isSelected ? "text-white" : "text-slate-400")} />}
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-4">
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="px-4 pt-2 pb-0"><CardTitle className="text-lg font-serif text-slate-800 flex items-center gap-2"><Euro className="h-5 w-5 text-emerald-600" /> Prix & Conditionnement</CardTitle></CardHeader>
                                <CardContent className="space-y-4 p-4 pt-0">
                                    <div className="flex gap-4 items-end">
                                        <FormField control={form.control as any} name="price_per_unit" render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Prix Standard (€)</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} className="text-xl font-bold font-serif h-10" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control as any} name="unit" render={({ field }) => (
                                            <FormItem className="w-1/3">
                                                <FormLabel>Unité</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="h-10"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>{UNIT_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <div className="pt-4 border-t border-slate-50">
                                        <FormField control={form.control as any} name="price_per_unit" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-slate-400 uppercase tracking-wider font-bold">Ajustement rapide</FormLabel>
                                                <FormControl>
                                                    <Slider defaultValue={[field.value || 0]} max={Math.max((field.value || 0) * 2, 50)} step={0.5} onValueChange={(vals) => field.onChange(vals[0])} value={[field.value || 0]} className="py-4" />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="px-4 pt-2 pb-0"><CardTitle className="text-lg font-serif text-slate-800 flex items-center gap-2"><Leaf className="h-5 w-5 text-emerald-600" /> Diététique</CardTitle></CardHeader>
                                <CardContent className="space-y-4 p-4 pt-0">
                                    <FormField control={form.control as any} name="allergens" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Allergènes présents</FormLabel>
                                            <FormControl><MultiSelect options={allergenOptions} selected={field.value || []} onChange={field.onChange} placeholder="Ajouter allergènes..." /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control as any} name="incompatible_diets" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Régimes Incompatibles</FormLabel>
                                            <FormControl><MultiSelect options={dietOptions} selected={field.value || []} onChange={field.onChange} placeholder="Ajouter régimes..." /></FormControl>
                                            <div className="text-[10px] text-slate-400 mt-1">Sélectionnez les régimes que ce produit <span className="font-bold text-red-500">interdit</span>.</div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                    {priceHistoryNode}
                </div>
            </form>
        </Form>
    );
}
