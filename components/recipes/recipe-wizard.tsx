"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, useWatch, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema, RecipeFormValues } from "@/lib/validators/recipe";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createRecipeWithDetails, getTags, createTag, deleteTag, FullRecipe } from "@/lib/api/recipes";
import { getIngredients, Ingredient } from "@/lib/api/ingredients";
import { convertQuantity } from "@/lib/conversions";
import { getConvertedCost } from "@/lib/pricing";
import { ImageUpload } from "@/components/ui/image-upload";
import { SpeechButton } from "@/components/ui/speech-button";
import { MultiSelect, MultiOption } from "@/components/ui/multi-select";
import { TagSelector, TagOption } from "@/components/ui/tag-selector";
import { StarRating } from "@/components/ui/star-rating";
import { Slider } from "@/components/ui/slider";
import { Loader2, Check, ChevronRight, ChevronLeft, X, CookingPot, UtensilsCrossed, Utensils, Tag, Leaf, Wheat, Plus, Trash2, Info, ArrowRight, Minus, Camera, Image as ImageIcon, Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getIconForCategory, getIconForTag } from "@/lib/ui-utils";
import { TimeStepper, IngredientSelector, getStepForUnit, getCompatibleUnits } from "@/components/recipes/recipe-shared";
import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { UNIT_OPTIONS } from "@/lib/validators/ingredient";

// Function: SortableItem (Local for now as it depends on local fields often, but let's see if we can use it simply)
function SortableItem({ id, dataId, children }: { id: string, dataId?: string, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : 1, opacity: isDragging ? 0.5 : 1, position: 'relative' as const };
    return (
        <div ref={setNodeRef} id={dataId} style={style} className={cn("flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-all", isDragging && "shadow-xl bg-slate-50 ring-2 ring-indigo-500/20")}>
            {children}
            <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-600 px-2 py-4 -mr-2">
                <div className="w-1 h-1 rounded-full bg-current mb-0.5" />
                <div className="w-1 h-1 rounded-full bg-current mb-0.5" />
                <div className="w-1 h-1 rounded-full bg-current" />
            </div>
        </div>
    )
}

export function RecipeWizard({ onClose, initialData, onUpdate }: { onClose?: () => void, initialData?: FullRecipe, onUpdate?: (data: RecipeFormValues, cost: number) => Promise<void> }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const steps = ["L'Identité", "Calibration", "Composition", "Méthode", "Classification", "Révision"];

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<TagOption[]>([]);
    const [themeOptions, setThemeOptions] = useState<TagOption[]>([]);
    const [allergenOptions, setAllergenOptions] = useState<MultiOption[]>([]);
    const [dietOptions, setDietOptions] = useState<MultiOption[]>([]);
    const dictationBaseText = useRef<string>("");

    useEffect(() => {
        getIngredients().then(setIngredients);
        getTags('category').then(tags => tags && setCategoryOptions(tags.map((t: any) => ({ label: t.name, value: t.id }))));
        getTags('theme').then(tags => tags && setThemeOptions(tags.map((t: any) => ({ label: t.name, value: t.id }))));
        getTags('allergen').then(tags => tags && setAllergenOptions(tags.map((t: any) => ({ label: t.name, value: t.id }))));
        getTags('diet').then(tags => tags && setDietOptions(tags.map((t: any) => ({ label: t.name, value: t.id }))));
    }, []);

    const form = useForm<RecipeFormValues>({
        // @ts-ignore
        resolver: zodResolver(recipeSchema) as any,
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            image_url: initialData?.image_url || "",
            base_servings: initialData?.base_servings || 4,
            base_servings_small: initialData?.base_servings_small || 6,
            target_margin: initialData?.target_margin || 70,
            tags: initialData?.recipe_tags?.filter(t => t.dietary_tags?.type === 'category').map(t => t.tag_id) || [],
            themes: initialData?.recipe_tags?.filter(t => t.dietary_tags?.type === 'theme').map(t => t.tag_id) || [],
            allergens: initialData?.recipe_tags?.filter(t => t.dietary_tags?.type === 'allergen').map(t => t.tag_id) || [],
            diets: initialData?.recipe_tags?.filter(t => t.dietary_tags?.type === 'diet').map(t => t.tag_id) || [],
            prep_time: initialData?.prep_time || 0,
            cook_time: initialData?.cook_time || 0,
            rating: initialData?.rating || 0,
            items: initialData?.recipe_items?.map(i => ({
                ingredient_id: i.ingredient_id,
                quantity_needed: i.quantity_needed,
                unit: i.unit,
                step: 0 // Default or try to infer?
            })) || [],
            steps: initialData?.recipe_steps?.sort((a, b) => a.step_order - b.step_order).map(s => ({
                step_order: s.step_order,
                instruction_text: s.instruction_text,
                image_url: s.image_url || undefined
            })) || [],
        }
    });

    const { fields: itemFields, append: appendItem, remove: removeItem, move: moveItem } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
        control: form.control,
        name: "steps",
    });

    const watchedItems = useWatch({ control: form.control, name: "items" });
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const getUnitAtIndex = (index: number) => {
        return watchedItems?.[index]?.unit || "kg";
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = itemFields.findIndex((i) => i.id === active.id);
            const newIndex = itemFields.findIndex((i) => i.id === over?.id);
            if (oldIndex !== -1 && newIndex !== -1) moveItem(oldIndex, newIndex);
        }
    };

    // Derived Financials for Review
    const calculatedCost = watchedItems?.reduce((acc, item) => {
        if (!item?.ingredient_id || !item?.quantity_needed) return acc;
        const ingredient = ingredients.find((i) => i.id === item.ingredient_id);
        if (!ingredient) return acc;
        return acc + getConvertedCost(ingredient.price_per_unit || 0, ingredient.unit || 'kg', item.quantity_needed, item.unit || 'kg');
    }, 0) || 0;
    const activeServings = (form.watch('base_servings') || 4); // Use standard servings for cost view
    const costPerServing = calculatedCost / activeServings;

    const canNext = () => {
        if (currentStep === 0) return !!form.watch("title"); // Step 1: Needs Title
        return true;
    };

    const goNext = () => {
        if (canNext() && currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    };
    const goBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
        else router.push("/recipes");
    };

    const onSubmit: SubmitHandler<RecipeFormValues> = async (data) => {
        setLoading(true);
        try {
            // Clean Data
            const validItems = (data.items || [])
                .filter(item => item.ingredient_id && item.quantity_needed > 0)
                .map(item => ({ ...item, unit: item.unit || 'kg' }));

            // For now, let's assume data.diets matches the expected tag IDs directly.
            // If legacy logic needed "Inversions", it should be handled specifically.
            // But we will stick to what the form produces.
            const payload = { ...data, items: validItems };

            if (onUpdate) {
                await onUpdate(payload, calculatedCost);
                toast.success("Recette modifiée avec succès !");
                // Don't redirect, parent likely handles closing or refetching
                if (onClose) onClose();
            } else {
                await createRecipeWithDetails(payload, calculatedCost);
                toast.success("Recette créée avec succès !");
                router.push("/recipes");
            }
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Form {...form}>
            <div className="fixed inset-0 bg-white z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <Button variant="ghost" size="icon" onClick={goBack} className="text-slate-400 hover:text-slate-900 -ml-2 rounded-full">
                        {currentStep === 0 ? <X className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                    </Button>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">{steps[currentStep]}</span>
                        <div className="flex gap-1.5 justify-center">
                            {steps.map((_, i) => (
                                <div key={i} className={cn("h-1 rounded-full transition-all duration-300",
                                    i === currentStep ? "bg-emerald-600 w-8" :
                                        i < currentStep ? "bg-emerald-900/20 w-2" : "bg-slate-100 w-2"
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
                    <div className="max-w-3xl mx-auto px-6 pt-8 pb-10 min-h-full flex flex-col justify-start text-center md:text-left">

                        {/* TOP NAVIGATION (Mobile Friendly counterpart) */}
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
                                className={cn("rounded-full h-12 w-12 bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl text-white",
                                    currentStep === steps.length - 1 && "opacity-0 pointer-events-none"
                                )}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* STEP 1: IDENTITY */}
                        {currentStep === 0 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">L'Identité</h2>
                                    <p className="text-slate-500">Quel est le nom de votre création ?</p>
                                </div>
                                <div className="text-center space-y-4">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <Input
                                            placeholder="Nom de la recette"
                                            {...field}
                                            className="text-center text-4xl md:text-5xl font-serif font-bold p-0 border-none shadow-none focus-visible:ring-0 placeholder:text-slate-200 text-slate-900 h-auto bg-transparent py-4"
                                            autoFocus
                                        />
                                    )} />
                                </div>
                                <div className="max-w-sm mx-auto">
                                    <FormField control={form.control} name="image_url" render={({ field }) => (
                                        <ImageUpload
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            onRemove={() => field.onChange("")}
                                            className="aspect-[4/3] w-full rounded-2xl shadow-lg border-4 border-white bg-slate-100"
                                        />
                                    )} />
                                </div>
                                <div className="max-w-md mx-auto">
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <Textarea placeholder="Racontez une histoire..." {...field} className="text-center resize-none border-none bg-transparent focus-visible:ring-0 text-slate-600 italic text-lg" rows={3} />
                                    )} />
                                </div>
                            </div>
                        )}

                        {/* STEP 2: CALIBRATION */}
                        {currentStep === 1 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center">
                                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Calibration</h2>
                                    <p className="text-slate-500">Les bases chiffrées de votre recette</p>
                                </div>

                                <Card className="border-none shadow-lg bg-white overflow-hidden">
                                    <CardContent className="p-0 divide-y divide-slate-100">
                                        <div className="p-6 flex flex-col gap-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Utensils className="h-5 w-5" /></div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Couverts</p>
                                                        <p className="text-xs text-slate-500">Standard & Petites faims</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-indigo-600">{form.watch('base_servings')}</span>
                                                    <span className="text-slate-400 mx-1">/</span>
                                                    <span className="text-xl font-bold text-slate-500">{form.watch('base_servings_small')}</span>
                                                </div>
                                            </div>

                                            <div className="px-2 pb-2">
                                                <Slider
                                                    defaultValue={[4, 6]}
                                                    max={20}
                                                    min={1}
                                                    step={1}
                                                    value={[form.watch('base_servings') || 4, form.watch('base_servings_small') || 6]}
                                                    onValueChange={(val) => {
                                                        form.setValue('base_servings', val[0]);
                                                        form.setValue('base_servings_small', val[1]);
                                                    }}
                                                    className="py-4"
                                                />
                                                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium uppercase tracking-wide">
                                                    <span>Standard</span>
                                                    <span>Petite faim</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 grid grid-cols-2 gap-8">
                                            <FormField control={form.control} name="prep_time" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex justify-center mb-4 text-slate-500 uppercase text-xs font-bold tracking-wider">Préparation</FormLabel>
                                                    <FormControl>
                                                        <TimeStepper value={field.value || 0} onChange={field.onChange} icon={UtensilsCrossed} />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="cook_time" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex justify-center mb-4 text-slate-500 uppercase text-xs font-bold tracking-wider">Cuisson</FormLabel>
                                                    <FormControl>
                                                        <TimeStepper value={field.value || 0} onChange={field.onChange} icon={CookingPot} />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="p-6 flex items-center justify-between bg-emerald-50/30">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-serif font-bold">%</div>
                                                <div>
                                                    <p className="font-bold text-slate-900">Marge Cible</p>
                                                    <p className="text-xs text-slate-500">Objectif de rentabilité</p>
                                                </div>
                                            </div>
                                            <div className="w-32">
                                                <div className="relative">
                                                    <Input type="number" {...form.register('target_margin', { valueAsNumber: true })} className="text-right pr-8 font-bold text-lg border-slate-200" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* STEP 3: COMPOSITION (Ingredients) */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col">
                                <div className="text-center flex-none">
                                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Composition</h2>
                                    <p className="text-slate-500">Ajoutez vos ingrédients</p>
                                </div>

                                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[400px]">
                                    {/* Toolbar */}
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-2">
                                        <div className="flex-1">
                                            <IngredientSelector
                                                value=""
                                                onChange={(id) => {
                                                    const ing = ingredients.find(i => i.id === id);
                                                    if (ing) appendItem({ ingredient_id: id, quantity_needed: 0, unit: ing.unit });
                                                }}
                                                ingredients={ingredients}
                                            />
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={itemFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                                {itemFields.map((field, index) => (
                                                    <SortableItem key={field.id} id={field.id}>
                                                        {/* Row Content */}
                                                        <div className="flex-1 flex items-center gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-slate-900 truncate">
                                                                    {ingredients.find(i => i.id === watchedItems[index]?.ingredient_id)?.name || "Inconnu"}
                                                                </div>
                                                                <div className="text-xs text-slate-400">
                                                                    {(calculatedCost / activeServings).toFixed(2)}€ estimé
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Input type="number" step={getStepForUnit(watchedItems[index]?.unit)} {...form.register(`items.${index}.quantity_needed`, { valueAsNumber: true })} className="w-20 text-right h-9 bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 transition-colors" placeholder="0" />
                                                                <div className="w-16 text-xs font-medium text-slate-500">{watchedItems[index]?.unit}</div>
                                                            </div>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /></Button>
                                                    </SortableItem>
                                                ))}
                                            </SortableContext>
                                        </DndContext>
                                        {itemFields.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                                <Leaf className="h-12 w-12 mb-2" />
                                                <p>Le panier est vide</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Totals */}
                                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-sm">
                                        <span>Total Est.</span>
                                        <span className="font-bold font-mono text-emerald-400">{calculatedCost.toFixed(2)}€</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: STEPS */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center">
                                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Méthode</h2>
                                    <p className="text-slate-500">Le déroulé de la recette</p>
                                </div>

                                <div className="space-y-4">
                                    {stepFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 group">
                                            <div className="flex-none w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md mt-1">{index + 1}</div>
                                            <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative">
                                                <FormField control={form.control} name={`steps.${index}.instruction_text`} render={({ field }) => (
                                                    <div className="relative">
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Décrivez l'action..."
                                                            className="min-h-[80px] border-none shadow-none resize-none focus:ring-0 p-0 text-base text-slate-700 placeholder:text-slate-300 bg-transparent pr-12"
                                                        />

                                                        <div className="absolute right-0 bottom-0 flex gap-2">
                                                            {/* Media Add Button */}
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button type="button" size="icon" className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                                                                        <Plus className="h-5 w-5" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent align="end" className="w-48 p-2 flex flex-col gap-1">
                                                                    <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600">
                                                                            <Camera className="h-4 w-4" />
                                                                        </div>
                                                                        <span className="font-medium text-slate-700">Caméra</span>
                                                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.onload = (e) => {
                                                                                    form.setValue(`steps.${index}.image_url`, e.target?.result as string);
                                                                                    toast.success("Image ajoutée");
                                                                                };
                                                                                reader.readAsDataURL(file);
                                                                            }
                                                                        }} />
                                                                    </label>
                                                                    <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-600">
                                                                            <ImageIcon className="h-4 w-4" />
                                                                        </div>
                                                                        <span className="font-medium text-slate-700">Galerie</span>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.onload = (e) => {
                                                                                    form.setValue(`steps.${index}.image_url`, e.target?.result as string);
                                                                                    toast.success("Image ajoutée");
                                                                                };
                                                                                reader.readAsDataURL(file);
                                                                            }
                                                                        }} />
                                                                    </label>
                                                                </PopoverContent>
                                                            </Popover>

                                                            <SpeechButton className="opacity-50 hover:opacity-100 transition-opacity" onStarted={() => dictationBaseText.current = field.value || ""} onTranscript={(txt) => field.onChange(`${dictationBaseText.current} ${txt}`)} />
                                                        </div>
                                                        {/* Image Preview */}
                                                        {form.watch(`steps.${index}.image_url`) && (
                                                            <div className="mt-3 relative inline-block group/img">
                                                                <img src={form.watch(`steps.${index}.image_url`)} alt={`Etape ${index + 1}`} className="h-24 w-24 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setValue(`steps.${index}.image_url`, "")}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )} />
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500" onClick={() => removeStep(index)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button type="button" variant="outline" onClick={() => appendStep({ step_order: stepFields.length + 1, instruction_text: "", image_url: "" })} className="w-full h-12 border-dashed text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50">
                                        <Plus className="mr-2 h-4 w-4" /> Ajouter une étape
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: CLASSIFICATION */}
                        {currentStep === 4 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center">
                                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Classification</h2>
                                    <p className="text-slate-500">Pour mieux la retrouver</p>
                                </div>

                                <Card className="border-none shadow-lg bg-white p-6 space-y-8">
                                    <FormField control={form.control} name="tags" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg font-serif font-bold text-slate-800 mb-4 block">Famille de plat</FormLabel>
                                            <FormControl>
                                                <TagSelector selected={field.value || []} options={categoryOptions} onChange={field.onChange} onCreate={async (l) => { const t = await createTag(l, 'category'); return t?.id; }} />
                                            </FormControl>
                                        </FormItem>
                                    )} />

                                    <div className="h-px bg-slate-100 w-full" />

                                    <FormField control={form.control} name="themes" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg font-serif font-bold text-slate-800 mb-4 block">Thèmes & Occasions</FormLabel>
                                            <FormControl>
                                                <TagSelector selected={field.value || []} options={themeOptions} onChange={field.onChange} onCreate={async (l) => { const t = await createTag(l, 'theme'); return t?.id; }} />
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </Card>
                            </div>
                        )}

                        {/* STEP 6: REVIEW */}
                        {currentStep === 5 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-serif font-bold text-emerald-900">Tout est bon ?</h2>
                                    <p className="text-slate-500 text-lg">Voici le résumé de votre création.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Coût matière</div>
                                        <div className="text-3xl font-bold text-slate-900">{calculatedCost.toFixed(2)}€</div>
                                        <div className="text-sm text-slate-500">Total panier</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Recommandé</div>
                                        <div className="text-3xl font-bold text-emerald-600">{(costPerServing / (1 - (form.watch('target_margin') || 70) / 100)).toFixed(2)}€</div>
                                        <div className="text-sm text-slate-500">Prix conseillé /pers</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Marge</div>
                                        <div className="text-3xl font-bold text-slate-900">{form.watch('target_margin')}%</div>
                                        <div className="text-sm text-slate-500">Ciblée</div>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <Button size="lg" className="rounded-full px-12 h-14 text-lg bg-slate-900 hover:bg-slate-800 shadow-xl hover:shadow-2xl transition-all hover:scale-105" onClick={form.handleSubmit(onSubmit, (errors) => {
                                        toast.error("Veuillez corriger les erreurs du formulaire");
                                        console.log(errors);
                                    })} disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : <Check className="mr-2 h-6 w-6" />}
                                        Valider la recette
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Form>
    );
}
