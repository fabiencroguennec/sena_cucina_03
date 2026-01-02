"use client";

import { useForm, useFieldArray, useWatch, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema, RecipeFormValues } from "@/lib/validators/recipe";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createRecipeWithDetails, updateRecipe, FullRecipe, getTags, createTag, deleteTag } from "@/lib/api/recipes";
import { getIngredients, Ingredient } from "@/lib/api/ingredients";
import { convertQuantity } from "@/lib/conversions";
import { getConvertedCost } from "@/lib/pricing";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMediaQuery } from "@/lib/use-media-query";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useRef, useMemo } from "react";
import {
    Loader2, Plus, Trash2, Calculator, User, Baby, CookingPot,
    Microwave, Utensils, Leaf, Target, ArrowLeft, GripVertical,
    Image as ImageIcon, ChevronDown, ChevronUp, Save, Wand2, Disc,
    Minus, UtensilsCrossed, Tag, Wheat, Check, ChevronsUpDown, X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UNIT_OPTIONS } from "@/lib/validators/ingredient";
import { ImageUpload } from "@/components/ui/image-upload";
import { SpeechButton } from "@/components/ui/speech-button";
import { MultiSelect, MultiOption } from "@/components/ui/multi-select";
import { TagSelector, TagOption } from "@/components/ui/tag-selector";
import { StarRating } from "@/components/ui/star-rating";
import { cn, removeAccents } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/lib/use-debounce";


function SortableItem({ id, dataId, children }: { id: string, dataId?: string, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : 1, opacity: isDragging ? 0.5 : 1, position: 'relative' as const };
    return (
        <div ref={setNodeRef} id={dataId} style={style} className={cn("flex flex-wrap md:flex-nowrap gap-2 items-center p-2 bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-200 transition-colors group", isDragging && "shadow-xl bg-slate-100 ring-2 ring-indigo-500/20")}>
            <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-600 self-center hidden md:flex h-full items-center px-1">
                <GripVertical className="h-4 w-4" />
            </div>
            {children}
        </div>
    )
}


const getStepForUnit = (unit: string) => {
    switch (unit) {
        case "kg":
        case "l":
            return "0.1"; // 100g / 100ml increments often used for bulk
        case "g":
        case "ml":
            return "10"; // 10g / 10ml increments
        case "cl":
            return "1";
        case "pcs":
        case "bot":
        case "box":
        case "cac":
        case "cas":
            return "1";
        default:
            return "1"; // Default step
    }
};

const getCompatibleUnits = (baseUnit: string) => {
    // List of all units that can correspond to mass or volume (now cross-convertible with 1g=1ml)
    const fluidUnits = ['kg', 'g', 'mg', 'l', 'cl', 'ml', 'cac', 'cas'];

    if (fluidUnits.includes(baseUnit)) {
        return UNIT_OPTIONS.filter(u => fluidUnits.includes(u.value));
    }

    // Default: allow only the base unit itself if no conversion group matches (e.g. pcs, box, bot)
    return UNIT_OPTIONS.filter(u => u.value === baseUnit);
};

// Fun Time Picker Component (Row style: Icon+Label on left, Stepper on right)
const TimeStepper = ({ value, onChange, icon: Icon, label }: { value: number, onChange: (val: number) => void, icon: any, label?: string }) => {
    const formatTime = (minutes: number) => {
        if (minutes === 0) return "0 min";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m} min`;
    };

    return (
        <div className="flex items-center justify-between gap-1 select-none group w-full bg-white rounded-lg p-1 border border-slate-200 shadow-sm hover:border-amber-200 transition-all">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-amber-600 disabled:opacity-30 flex-none"
                onClick={() => onChange(Math.max(0, value - 5))}
                disabled={value <= 0}
            >
                <Minus className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center gap-2 flex-1">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span className={cn("font-bold text-sm tabular-nums text-center", value === 0 ? "text-slate-300" : "text-slate-700")}>
                    {formatTime(value)}
                </span>
                {label && <span className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 hidden sm:inline-block">{label}</span>}
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-amber-600 flex-none"
                onClick={() => onChange(value + 5)}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
};




const IngredientSelector = ({ value, onChange, ingredients }: { value: string, onChange: (val: string) => void, ingredients: Ingredient[] }) => {
    const [open, setOpen] = useState(false);
    const selected = ingredients.find((i) => i.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-sm bg-white border-slate-200 h-9 hover:bg-slate-50 hover:text-slate-900"
                >
                    <span className="truncate">{selected ? selected.name : "Ingrédient..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                    const normValue = removeAccents(value).toLowerCase();
                    const normSearch = removeAccents(search).toLowerCase();
                    return normValue.includes(normSearch) ? 1 : 0;
                }}>
                    <CommandInput placeholder="Rechercher..." />
                    <CommandList>
                        <CommandEmpty>Aucun résultat.</CommandEmpty>
                        <CommandGroup>
                            {ingredients.map((ing) => (
                                <CommandItem
                                    key={ing.id}
                                    value={ing.name}
                                    onSelect={() => {
                                        onChange(ing.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === ing.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {ing.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


interface RecipeFormProps {
    initialData?: FullRecipe;
}

export function RecipeForm({ initialData }: RecipeFormProps) {
    const router = useRouter();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState<TagOption[]>([]);
    const [themeOptions, setThemeOptions] = useState<TagOption[]>([]);
    const [allergenOptions, setAllergenOptions] = useState<MultiOption[]>([]);
    const [dietOptions, setDietOptions] = useState<MultiOption[]>([]);
    const [isStepsOpen, setIsStepsOpen] = useState(true);
    const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);
    const dictationBaseText = useRef<string>("");

    useEffect(() => {
        getIngredients().then(setIngredients);
        // Load existing tags
        getTags('category').then(tags => {
            if (tags) setCategoryOptions(tags.map((t: any) => ({ label: t.name, value: t.id })));
        });
        getTags('theme').then(tags => {
            if (tags) setThemeOptions(tags.map((t: any) => ({ label: t.name, value: t.id })));
        });
        getTags('allergen').then(tags => {
            if (tags) setAllergenOptions(tags.map((t: any) => ({ label: t.name, value: t.id })));
        });
        getTags('diet').then(tags => {
            if (tags) setDietOptions(tags.map((t: any) => ({ label: t.name, value: t.id })));
        });
    }, []);

    const form = useForm<RecipeFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(recipeSchema) as any,

        defaultValues: initialData ? {
            title: initialData.title,
            description: initialData.description || "",
            image_url: initialData.image_url || "",
            base_servings: initialData.base_servings,
            base_servings_small: initialData.base_servings_small || Math.ceil(initialData.base_servings * 1.5),
            target_margin: initialData.target_margin || 70,
            tags: initialData.recipe_tags?.filter(rt => categoryOptions.some(opt => opt.value === rt.tag_id)).map(rt => rt.tag_id) || [],
            themes: initialData.recipe_tags?.map(rt => rt.tag_id).filter(id => themeOptions.some(opt => opt.value === id)) || [],
            // Filter by existing options to correctly categorize them
            allergens: initialData.recipe_tags?.map(rt => rt.tag_id).filter(id => allergenOptions.some(opt => opt.value === id)) || [],
            diets: initialData.recipe_tags?.map(rt => rt.tag_id).filter(id => dietOptions.some(opt => opt.value === id)) || [],

            prep_time: initialData.prep_time || 0,
            cook_time: initialData.cook_time || 0,
            items: initialData.recipe_items.map(item => ({
                ingredient_id: item.ingredient_id,
                quantity_needed: item.quantity_needed,
                unit: item.unit
            })),
            steps: initialData.recipe_steps.sort((a, b) => a.step_order - b.step_order).map(step => ({
                step_order: step.step_order,
                instruction_text: step.instruction_text,
                image_url: step.image_url || ""
            })),
            rating: initialData.rating || 0
        } : {
            title: "",
            description: "",
            image_url: "",
            base_servings: 4,
            base_servings_small: 6,
            target_margin: 70,
            tags: [],
            themes: [],
            allergens: [],
            diets: [],
            prep_time: 0,
            cook_time: 0,
            rating: 0,
            items: [{ ingredient_id: "", quantity_needed: 0, unit: "kg" }],
            steps: [],
        },
    });

    // Refresh defaults when options load
    useEffect(() => {
        if (!initialData) return;
        const currentTags = initialData.recipe_tags?.map(rt => rt.tag_id) || [];

        if (categoryOptions.length > 0) {
            const valid = currentTags.filter(id => categoryOptions.some(o => o.value === id));
            if (JSON.stringify(valid) !== JSON.stringify(form.getValues('tags'))) form.setValue('tags', valid);
        }
        if (themeOptions.length > 0) {
            const valid = currentTags.filter(id => themeOptions.some(o => o.value === id));
            if (JSON.stringify(valid) !== JSON.stringify(form.getValues('themes'))) form.setValue('themes', valid);
        }
        if (allergenOptions.length > 0) {
            const valid = currentTags.filter(id => allergenOptions.some(o => o.value === id));
            if (JSON.stringify(valid) !== JSON.stringify(form.getValues('allergens'))) form.setValue('allergens', valid);
        }
        if (dietOptions.length > 0) {
            // Logic Inversion: Database stores Compatible. Form displays Incompatible.
            // Incompatible = AllOptions - Compatible(Data)
            const currentCompatible = initialData.recipe_tags?.map(rt => rt.tag_id) || [];
            const impliedIncompatible = dietOptions
                .filter(opt => !currentCompatible.includes(opt.value))
                .map(opt => opt.value);

            // Only update if different to avoid infinite loops if we were triggering changes
            const currentFormValue = form.getValues('diets') || [];
            if (JSON.stringify(impliedIncompatible.sort()) !== JSON.stringify(currentFormValue.sort())) {
                form.setValue('diets', impliedIncompatible);
            }
        }
    }, [categoryOptions, themeOptions, allergenOptions, dietOptions, initialData, form]);

    // Handle Create Tag
    const handleCreateCategory = async (label: string) => {
        try {
            const newTag = await createTag(label, 'category');
            if (newTag) {
                const newOption = { label: newTag.name, value: newTag.id };
                setCategoryOptions(prev => [...prev, newOption]);
                return newTag.id;
            }
        } catch (e) {
            toast.error("Erreur lors de la création de la catégorie");
            console.error(e);
        }
    };

    // Handle Create Theme
    const handleCreateTheme = async (label: string) => {
        try {
            const newTag = await createTag(label, 'theme');
            if (newTag) {
                const newOption = { label: newTag.name, value: newTag.id };
                setThemeOptions(prev => [...prev, newOption]);
                return newTag.id;
            }
        } catch (e) {
            toast.error("Erreur lors de la création du thème (nom unique ?)");
            console.error(e);
        }
    };

    // Handle Delete Category
    const handleDeleteCategory = async (id: string) => {
        try {
            await deleteTag(id);
            // Remove from options
            setCategoryOptions(prev => prev.filter(o => o.value !== id));
            // Remove from selected list if present
            const currentTags = form.getValues('tags') || [];
            if (currentTags.includes(id)) {
                form.setValue('tags', currentTags.filter(t => t !== id));
            }
            toast.success("Catégorie supprimée");
        } catch (e: any) {
            const msg = e.message || "Erreur";
            if (msg.includes("Voulez-vous le supprimer définitivement")) {
                if (window.confirm(msg)) {
                    try {
                        await deleteTag(id, true);
                        setCategoryOptions(prev => prev.filter(o => o.value !== id));
                        const currentTags = form.getValues('tags') || [];
                        if (currentTags.includes(id)) {
                            form.setValue('tags', currentTags.filter(t => t !== id));
                        }
                        toast.success("Catégorie supprimée définitivement");
                    } catch (err) {
                        console.error(err);
                        toast.error("Erreur lors de la suppression forcée");
                    }
                }
            } else {
                toast.error(msg);
                console.error(e);
            }
        }
    };

    // Handle Delete Theme
    const handleDeleteTheme = async (id: string) => {
        try {
            await deleteTag(id);
            setThemeOptions(prev => prev.filter(o => o.value !== id));
            const currentThemes = form.getValues('themes') || [];
            if (currentThemes.includes(id)) {
                form.setValue('themes', currentThemes.filter(t => t !== id));
            }
            toast.success("Thème supprimé");
        } catch (e: any) {
            const msg = e.message || "Erreur";
            if (msg.includes("Voulez-vous le supprimer définitivement")) {
                if (window.confirm(msg)) {
                    try {
                        await deleteTag(id, true);
                        setThemeOptions(prev => prev.filter(o => o.value !== id));
                        const currentThemes = form.getValues('themes') || [];
                        if (currentThemes.includes(id)) {
                            form.setValue('themes', currentThemes.filter(t => t !== id));
                        }
                        toast.success("Thème supprimé définitivement");
                    } catch (err) {
                        console.error(err);
                        toast.error("Erreur lors de la suppression forcée");
                    }
                }
            } else {
                toast.error(msg);
                console.error(e);
            }
        }
    };

    const { fields: itemFields, append: appendItem, remove: removeItem, move: moveItem } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = itemFields.findIndex((i) => i.id === active.id);
            const newIndex = itemFields.findIndex((i) => i.id === over?.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                moveItem(oldIndex, newIndex);
            }
        }
    };

    const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
        control: form.control,
        name: "steps",
    });

    // Watch for live cost calculation and unit updates
    const watchedItems = useWatch({
        control: form.control,
        name: "items",
    });
    const baseServings = form.watch("base_servings") || 4;
    const baseServingsSmall = form.watch("base_servings_small") || 6;
    const targetMargin = form.watch("target_margin") || 0;

    // Plate Size Selection for Calculation
    const [plateSize, setPlateSize] = useState<'large' | 'small'>('large');

    // User requested:
    // Large Plate = "Petit nombre de couverts" (e.g. 4) -> Bigger portions
    // Small Plate = "Grand nombre de couverts" (e.g. 6) -> Smaller portions
    // Logic Assumption: base_servings is the lower number (standard), base_servings_small is the higher number (optional max).
    // Or vice versa? Usually "base" is standard. If range is 4-6, 4 is min.
    // Let's assume user inputs maintain Min <= Max.
    // Safest bet: activeServings = 'large' ? min(s1, s2) : max(s1, s2).
    const activeServings = useMemo(() => {
        const s1 = Number(baseServings) || 1;
        const s2 = Number(baseServingsSmall) || 1;
        if (plateSize === 'large') return Math.min(s1, s2);
        return Math.max(s1, s2);
    }, [baseServings, baseServingsSmall, plateSize]);


    // Calculate total cost
    const totalCost = watchedItems?.reduce((acc, item) => {
        if (!item?.ingredient_id || !item?.quantity_needed) return acc;
        const ingredient = ingredients.find((i) => i.id === item.ingredient_id);
        if (!ingredient) return acc;

        return acc + getConvertedCost(ingredient.price_per_unit || 0, ingredient.unit || 'kg', item.quantity_needed, item.unit || 'kg');
    }, 0) || 0;

    const costPerServing = totalCost / activeServings;
    const suggestedPrice = totalCost / (1 - targetMargin / 100);
    const pricePerServing = suggestedPrice / activeServings;

    // Calculate Total Weight (in grams) for Dashboard
    const totalWeightGrams = watchedItems?.reduce((acc, item) => {
        if (!item?.ingredient_id || !item?.quantity_needed || !item?.unit) return acc;
        // Only convert standard mass/volume units.
        if (['kg', 'g', 'l', 'cl', 'ml'].includes(item.unit)) {
            return acc + convertQuantity(item.quantity_needed, item.unit, 'g');
        }
        return acc;
    }, 0) || 0;
    const weightPerServing = totalWeightGrams / activeServings;


    // Auto-save Logic
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const isFirstRender = useRef(true);
    const allFormData = form.watch(); // Watch all fields
    const debouncedFormData = useDebounce(allFormData, 1000); // 1s debounce

    // Serialize Auto-Saves to prevent race conditions (Delete/Insert conflicts)
    const isSaving = useRef(false);
    const pendingSave = useRef<RecipeFormValues | null>(null);
    const lastSavedData = useRef<string>("");

    // Auto-calculate Allergens and Diets based on Ingredients
    useEffect(() => {
        if (!ingredients.length || !dietOptions.length) return;

        const currentItems = watchedItems || [];
        const utilizedIngredients = currentItems
            .map(item => ingredients.find(i => i.id === item.ingredient_id))
            .filter(Boolean) as Ingredient[];

        // 1. Allergens (Union of all ingredients' allergens)
        const detectedAllergens = new Set<string>();
        utilizedIngredients.forEach(ing => {
            ing.ingredient_tags?.forEach(t => {
                if (t.dietary_tags?.type === 'allergen') {
                    detectedAllergens.add(t.tag_id);
                }
            });
        });
        const allergenIds = Array.from(detectedAllergens);

        const currentAllergens = form.getValues('allergens') || [];
        if (JSON.stringify(allergenIds.sort()) !== JSON.stringify(currentAllergens.sort())) {
            form.setValue('allergens', allergenIds, { shouldValidate: true, shouldDirty: true });
        }

        // 2. Diets (Display: INCOMPATIBLE)
        // We calculate what is incompatible based on ingredients direct incompatible_diets AND inferred from allergens
        const incompatibleDietIds = new Set<string>();

        // Helper to find diet ID by flexible name matching
        const findDietId = (keyword: string) => dietOptions.find(d => d.label.toLowerCase().includes(keyword.toLowerCase()))?.value;

        // Cache Diet IDs
        const dietIds = {
            glutenFree: findDietId('sans gluten') || findDietId('gluten free'),
            lactoseFree: findDietId('sans lactose') || findDietId('lactose free'),
            vegan: findDietId('vegan') || findDietId('végétalien'),
            vegetarian: findDietId('végétarien') || findDietId('vegetarian'),
        };

        utilizedIngredients.forEach(ing => {
            // A. Explicit Incompatibilities set on Ingredient
            ing.incompatible_diets?.forEach(id => incompatibleDietIds.add(id));

            // B. Inferred Incompatibilities from Allergens
            ing.ingredient_tags?.forEach(t => {
                if (t.dietary_tags?.type === 'allergen') {
                    const name = t.dietary_tags.name.toLowerCase();

                    // Gluten -> Not Gluten Free
                    if (name.includes('gluten') && dietIds.glutenFree) incompatibleDietIds.add(dietIds.glutenFree);

                    // Milk -> Not Lactose Free, Not Vegan
                    if (name.includes('lait') || name.includes('milk')) {
                        if (dietIds.lactoseFree) incompatibleDietIds.add(dietIds.lactoseFree);
                        if (dietIds.vegan) incompatibleDietIds.add(dietIds.vegan);
                    }

                    // Egg -> Not Vegan
                    if (name.includes('euf') || name.includes('egg')) { // "oeuf", "œuf"
                        if (dietIds.vegan) incompatibleDietIds.add(dietIds.vegan);
                    }

                    // Fish/Shellfish -> Not Vegetarian, Not Vegan
                    if (name.includes('poisson') || name.includes('crustac') || name.includes('mollusque') || name.includes('fish')) {
                        if (dietIds.vegetarian) incompatibleDietIds.add(dietIds.vegetarian);
                        if (dietIds.vegan) incompatibleDietIds.add(dietIds.vegan);
                    }
                }
            });
        });
        const autoDetectedIncompatible = Array.from(incompatibleDietIds);

        const currentDiets = form.getValues('diets') || [];
        // Compare auto-detected vs current. 
        // Note: User can manually add incompatible diets. We should merge?
        // Actually, if we just overwrite, we lose manual edits. 
        // But the requirement "Prefere l'affichage" usually implies automation visibility.
        // Let's force update mostly because ingredients change defines the core incompatibilities.
        // If we want to support manual "Free From" that aren't in ingredients... 
        // For now, let's trust the ingredients as the source of truth for incompatibilities + user can add more.
        // But if user removes one? If ingredient causes it, removing it is wrong.
        // Let's just set it to the detected set for now to ensure safety.

        if (JSON.stringify(autoDetectedIncompatible.sort()) !== JSON.stringify(currentDiets.sort())) {
            form.setValue('diets', autoDetectedIncompatible, { shouldValidate: true, shouldDirty: true });
        }

    }, [watchedItems, ingredients, dietOptions, form]);

    useEffect(() => {
        // Skip auto-save if not editing an existing recipe or if it's the first render
        if (!initialData || isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Check if data actually changed to avoid redundant saves (optional but good)
        const currentDataString = JSON.stringify(debouncedFormData);
        if (currentDataString === lastSavedData.current) return;

        const performSave = async (data: RecipeFormValues) => {
            isSaving.current = true;
            setSaveStatus('saving');

            try {
                // Prepare Data
                const currentItems = data.items || [];
                const validItems = currentItems
                    .filter(item => item.ingredient_id && item.quantity_needed > 0)
                    .map(item => ({ ...item, unit: item.unit || 'kg' }));

                const compatibleDiets = dietOptions
                    .filter(opt => !(data.diets || []).includes(opt.value))
                    .map(opt => opt.value);

                const dataToSave = {
                    ...data,
                    items: validItems,
                    diets: compatibleDiets
                };

                const computedCost = validItems.reduce((acc: number, item: any) => {
                    if (!item?.ingredient_id || !item?.quantity_needed) return acc;
                    const ingredient = ingredients.find((i) => i.id === item.ingredient_id);
                    if (!ingredient) return acc;
                    return acc + getConvertedCost(ingredient.price_per_unit || 0, ingredient.unit || 'kg', item.quantity_needed, item.unit || 'kg');
                }, 0);

                await updateRecipe(initialData.id, dataToSave as RecipeFormValues, computedCost);

                lastSavedData.current = JSON.stringify(data);
                setSaveStatus('saved');
            } catch (error) {
                console.error("Auto-save error detailed:", JSON.stringify(error, null, 2), error);
                setSaveStatus('error');
            } finally {
                isSaving.current = false;

                // Process pending save if any
                if (pendingSave.current) {
                    const nextData = pendingSave.current;
                    pendingSave.current = null;
                    performSave(nextData);
                } else {
                    setTimeout(() => setSaveStatus('idle'), 2000);
                }
            }
        };

        if (isSaving.current) {
            // Queue the save
            pendingSave.current = debouncedFormData;
        } else {
            // Start immediate save
            performSave(debouncedFormData);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFormData, initialData]);

    const onSubmit: SubmitHandler<RecipeFormValues> = async (data) => {
        setLoading(true);
        try {
            // Invert Diets: Form has "Incompatible", DB needs "Compatible"
            const compatibleDiets = dietOptions
                .filter(opt => !(data.diets || []).includes(opt.value))
                .map(opt => opt.value);

            // Calculate Total Cost for Manual Save
            const validItems = (data.items || [])
                .filter(item => item.ingredient_id && item.quantity_needed > 0)
                .map(item => ({ ...item, unit: item.unit || 'kg' })); // Ensure unit

            const totalCost = validItems.reduce((acc: number, item: any) => {
                if (!item?.ingredient_id || !item?.quantity_needed) return acc;
                const ingredient = ingredients.find((i) => i.id === item.ingredient_id);
                if (!ingredient) return acc;
                return acc + getConvertedCost(ingredient.price_per_unit || 0, ingredient.unit || 'kg', item.quantity_needed, item.unit || 'kg');
            }, 0);

            const payload = { ...data, diets: compatibleDiets };

            if (initialData) {
                await updateRecipe(initialData.id, payload, totalCost);
                toast.success("Recette mise à jour !");
                router.push(`/recipes/${initialData.id}`);
            } else {
                await createRecipeWithDetails(payload, totalCost);
                toast.success("Recette créée avec succès !");
                router.push("/recipes");
            }
            router.refresh();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Helper to get unit for a specific index safely
    const getUnitAtIndex = (index: number) => {
        return watchedItems?.[index]?.unit || "kg";
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="min-h-screen bg-slate-50/50 pb-20">
                {/* Top Bar: Back Link & Cooking Mode */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between gap-4">
                    <Link href={initialData ? `/recipes/${initialData.id}` : "/recipes"} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Retour à la recette
                    </Link>

                    {initialData && (
                        <Link href={`/recipes/${initialData.id}/cook`}>
                            <Button variant="outline" size="sm" className="flex gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-emerald-600 shadow-sm bg-white">
                                <CookingPot className="h-4 w-4" />
                                Mode Cuisine
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Header / Financial Dashboard */}
                <div className="md:sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                            {/* Center: Financial Indicators */}
                            <div className="flex-1 flex flex-wrap items-center justify-start md:pl-4 gap-4 text-sm">
                                {/* Marge Cible Input */}
                                <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
                                    <span className="text-slate-500 font-medium hidden sm:inline">Marge</span>
                                    <FormField
                                        control={form.control}
                                        name="target_margin"
                                        render={({ field }) => (
                                            <FormItem className="space-y-0">
                                                <FormControl>
                                                    <div className="relative w-12">
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            className="h-6 px-1 py-0 text-center border-none bg-transparent focus-visible:ring-0 font-bold text-slate-900 pr-3"
                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {isMobile && (
                                    <Button size="icon" type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-sm ml-2 flex-none">
                                        <Check className="h-5 w-5" />
                                    </Button>
                                )}

                                {/* Plate Size Toggle */}
                                <div className="flex flex-col items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200 h-[38px] justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setPlateSize('large')}
                                        className={cn(
                                            "transition-all leading-none",
                                            plateSize === 'large' ? "text-slate-900 scale-110" : "text-slate-300 hover:text-slate-500"
                                        )}
                                        title="Grande Assiette (Minimum de couverts, grosse portion)"
                                    >
                                        <Disc className="h-4 w-4 fill-current" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPlateSize('small')}
                                        className={cn(
                                            "transition-all leading-none",
                                            plateSize === 'small' ? "text-slate-900 scale-110" : "text-slate-300 hover:text-slate-500"
                                        )}
                                        title="Petite Assiette (Maximum de couverts, petite portion)"
                                    >
                                        <Disc className="h-2.5 w-2.5 fill-current" />
                                    </button>
                                </div>

                                {/* Metrics Display */}
                                <div className="flex gap-4 sm:gap-6 bg-white px-4 py-2 rounded-lg border shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Poids / pers.</span>
                                        <span className="font-bold text-slate-700">
                                            {weightPerServing > 0 ? `${Math.round(weightPerServing)}g` : '-'}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-200 mx-2" />

                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Coût Total</span>
                                        <span className="font-bold text-slate-900">{totalCost.toFixed(2)}€</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-200 mx-2" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Coût / pers.</span>
                                        <span className="font-bold text-slate-700">{costPerServing.toFixed(2)}€</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-200 mx-2" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-0.5">Prix / pers.</span>
                                        <span className="font-bold text-emerald-600">{pricePerServing.toFixed(2)}€</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <Button type="submit" disabled={loading} size="default" className={cn("bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-10 px-8 font-semibold", loading && "opacity-80")}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enregistrer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* 1. Main Column: Identity, Ingredients, Steps (md:col-span-8) */}
                        <div className="md:col-span-8 space-y-6">

                            {/* Identity Card */}
                            <Card className="border-none shadow-md overflow-hidden">
                                <CardContent className="p-0 flex flex-col sm:flex-row">
                                    <div className="sm:w-1/3 min-h-[200px] bg-slate-100 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-center">
                                        <FormField
                                            control={form.control}
                                            name="image_url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <ImageUpload
                                                            value={field.value || ""}
                                                            onChange={field.onChange}
                                                            onRemove={() => field.onChange("")}
                                                            className="aspect-square w-full rounded-lg shadow-inner"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                    </div>
                                    <div className="flex-1 p-6 space-y-4 bg-white/50 dark:bg-slate-950/50">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1 w-full">
                                                        <FormLabel className="sr-only">Titre</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Titre de la recette..." {...field} className="text-2xl md:text-4xl font-bold font-serif border-x-0 border-t-0 border-b-2 border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent placeholder:text-slate-300" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="rating"
                                                render={({ field }) => (
                                                    <FormItem className="self-end md:self-auto">
                                                        <FormControl>
                                                            <StarRating value={field.value || 0} onChange={field.onChange} size={20} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="sr-only">Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Une petite histoire à propos de ce plat..." {...field} className="resize-none border-none bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-1 focus-visible:ring-slate-200" rows={4} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ingredients Card */}
                            <Card className="border-none shadow-md">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-slate-800 flex flex-row items-center justify-between py-3 px-6">
                                    <CardTitle className="font-serif text-lg text-slate-800 dark:text-slate-200">Ingrédients</CardTitle>
                                    <div className="text-xs font-medium text-slate-500">Total: {itemFields.length}</div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-3">
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={itemFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                                {itemFields.map((field, index) => (
                                                    <SortableItem
                                                        key={field.id}
                                                        id={field.id}
                                                        dataId={watchedItems?.[index]?.ingredient_id ? `recipe-item-${watchedItems[index].ingredient_id}` : undefined}
                                                    >
                                                        <div className="hidden md:flex flex-none w-6 justify-center items-center text-slate-300 font-bold text-xs">{index + 1}</div>

                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.ingredient_id`}
                                                            render={({ field: selectField }) => (
                                                                <FormItem className="flex-1 min-w-[180px] space-y-0">
                                                                    <FormControl>
                                                                        <IngredientSelector
                                                                            value={selectField.value}
                                                                            onChange={(value) => {
                                                                                selectField.onChange(value);
                                                                                const selectedIng = ingredients.find(i => i.id === value);
                                                                                if (selectedIng) {
                                                                                    form.setValue(`items.${index}.unit`, selectedIng.unit);
                                                                                }
                                                                            }}
                                                                            ingredients={ingredients}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.quantity_needed`}
                                                            render={({ field: qtyField }) => (
                                                                <FormItem className="w-20 space-y-0">
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            step={getStepForUnit(getUnitAtIndex(index))}
                                                                            min="0"
                                                                            placeholder="0"
                                                                            {...qtyField}
                                                                            onChange={e => qtyField.onChange(parseFloat(e.target.value))}
                                                                            className="bg-white dark:bg-slate-950 h-9 text-right pr-2 text-sm"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.unit`}
                                                            render={({ field: unitField }) => {
                                                                const currentItemId = form.getValues(`items.${index}.ingredient_id`);
                                                                const currentIngredient = ingredients.find(i => i.id === currentItemId);
                                                                const baseUnit = currentIngredient?.unit || unitField.value;
                                                                const compatibleUnits = getCompatibleUnits(baseUnit);

                                                                return (
                                                                    <FormItem className="w-24 space-y-0">
                                                                        <Select
                                                                            onValueChange={(newUnit) => {
                                                                                const currentQty = form.getValues(`items.${index}.quantity_needed`);
                                                                                const oldUnit = unitField.value;
                                                                                if (currentQty && oldUnit && newUnit) {
                                                                                    const converted = convertQuantity(currentQty, oldUnit, newUnit);
                                                                                    // 1. Update unit first
                                                                                    unitField.onChange(newUnit);
                                                                                    // 2. Update quantity with a slight delay or directly? Directly is fine.
                                                                                    // Round to 4 decimals to avoid floating point weirdness
                                                                                    const rounded = Math.round(converted * 10000) / 10000;
                                                                                    form.setValue(`items.${index}.quantity_needed`, rounded);
                                                                                } else {
                                                                                    unitField.onChange(newUnit);
                                                                                }
                                                                            }}
                                                                            value={unitField.value}
                                                                            disabled={!currentItemId}
                                                                        >
                                                                            <FormControl>
                                                                                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-9 text-xs">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                            </FormControl>
                                                                            <SelectContent>
                                                                                {compatibleUnits.map(u => (
                                                                                    <SelectItem key={u.value} value={u.value} className="text-xs">
                                                                                        {u.label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />

                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </SortableItem>
                                                ))}
                                            </SortableContext>
                                        </DndContext>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => appendItem({ ingredient_id: "", quantity_needed: 0, unit: "kg" })}
                                            className="border-dashed h-8 text-xs"
                                        >
                                            <Plus className="mr-2 h-3 w-3" /> Ajouter
                                        </Button>

                                        <Dialog open={isIngredientDialogOpen} onOpenChange={setIsIngredientDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="ghost" size="sm" className="text-slate-500 h-8 text-xs">
                                                    Créer nouveau
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-lg w-full h-[100dvh] sm:h-auto p-0 sm:p-6 border-none sm:border rounded-none sm:rounded-lg overflow-hidden sm:overflow-visible flex flex-col sm:block [&>button]:hidden sm:[&>button]:block" onInteractOutside={(e) => e.preventDefault()}>
                                                <DialogTitle className="sr-only">Créer un nouvel ingrédient</DialogTitle>
                                                <div className="flex-1 min-h-0 sm:h-auto">
                                                    <IngredientForm
                                                        onSuccess={async (newIngredient) => {
                                                            try {
                                                                const newIngredients = await getIngredients();
                                                                setIngredients(newIngredients);

                                                                if (newIngredient) {
                                                                    appendItem({
                                                                        ingredient_id: newIngredient.id,
                                                                        quantity_needed: 0,
                                                                        unit: newIngredient.unit
                                                                    });
                                                                    toast.success("Ingrédient créé et ajouté !");

                                                                    // Scroll logic
                                                                    setTimeout(() => {
                                                                        const el = document.getElementById(`recipe-item-${newIngredient.id}`);
                                                                        if (el) {
                                                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                            el.classList.add("ring-2", "ring-emerald-500", "transition-all", "duration-1000");
                                                                            setTimeout(() => el.classList.remove("ring-2", "ring-emerald-500"), 2000);
                                                                        }
                                                                    }, 500); // 500ms to allow render and transition
                                                                } else {
                                                                    toast.info("Liste des ingrédients mise à jour");
                                                                }
                                                            } catch (error) {
                                                                console.error("Error creating ingredient:", error);
                                                                toast.error("Erreur lors de l'ajout de l'ingrédient");
                                                            } finally {
                                                                setIsIngredientDialogOpen(false);
                                                            }
                                                        }}
                                                        onCancel={() => setIsIngredientDialogOpen(false)}
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>



                        </div>

                        {/* 2. Side Settings Column (Minimzed Design, Non-Sticky) */}
                        <div className="md:col-span-4 space-y-4">

                            {/* Card A: Logistics Sliders only */}
                            <Card className="shadow-sm border-slate-200 bg-white">
                                <CardContent className="px-3 py-2">
                                    {/* Portions Slider */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Couverts</span>
                                            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full"><strong className="text-slate-900">{baseServings}</strong> - <strong className="text-slate-900">{baseServingsSmall}</strong> pers.</span>
                                        </div>
                                        <Slider
                                            defaultValue={[baseServings, baseServingsSmall]}
                                            max={12}
                                            min={1}
                                            step={1}
                                            value={[form.watch('base_servings') || 4, form.watch('base_servings_small') || 6]}
                                            onValueChange={(val) => {
                                                form.setValue('base_servings', val[0]);
                                                form.setValue('base_servings_small', val[1]);
                                            }}
                                            className="py-1 my-0.5"
                                        />
                                        <div className="hidden text-[10px] text-slate-400 mt-1 text-center">
                                            Ce plat est pour entre <span className="font-bold text-slate-600">{baseServings}</span> gros mangeurs et <span className="font-bold text-slate-600">{baseServingsSmall}</span> petits mangeurs.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Times (Vertical Stack, Clean) */}
                            <div className="flex flex-col gap-2 pt-2">
                                <FormField
                                    control={form.control}
                                    name="prep_time"
                                    render={({ field }) => (
                                        <FormItem className="space-y-0">
                                            <FormControl>
                                                <TimeStepper
                                                    value={field.value || 0}
                                                    onChange={field.onChange}
                                                    icon={UtensilsCrossed}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cook_time"
                                    render={({ field }) => (
                                        <FormItem className="space-y-0">
                                            <FormControl>
                                                <TimeStepper
                                                    value={field.value || 0}
                                                    onChange={field.onChange}
                                                    icon={CookingPot}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Card B: Categorization (Compact) */}
                            <Card className="shadow-sm border-slate-200 bg-white">
                                <CardContent className="p-3 space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="tags"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Utensils className="h-4 w-4 text-slate-400" />
                                                    <FormLabel className="font-semibold text-slate-700">Type de plat</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <TagSelector
                                                        selected={field.value || []}
                                                        options={categoryOptions}
                                                        onChange={field.onChange}
                                                        onCreate={handleCreateCategory}
                                                        onDelete={handleDeleteCategory}
                                                        placeholder="Chercher..."
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="themes"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1 mt-4 border-t pt-4 border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Tag className="h-4 w-4 text-slate-400" />
                                                    <FormLabel className="font-semibold text-slate-700">Thèmes</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <TagSelector
                                                        selected={field.value || []}
                                                        options={themeOptions}
                                                        onChange={field.onChange}
                                                        onCreate={handleCreateTheme}
                                                        onDelete={handleDeleteTheme}
                                                        placeholder="Chercher..."
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Card C: Dietary (Compact) */}
                            <Card className="shadow-sm border-slate-200 bg-white">
                                <CardContent className="p-3 space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="allergens"
                                        render={({ field }) => (
                                            <FormItem className="space-y-0 flex items-center gap-2">
                                                <Wheat className="h-4 w-4 text-slate-400 flex-none" />
                                                <FormControl>
                                                    <MultiSelect
                                                        selected={field.value || []}
                                                        options={allergenOptions}
                                                        onChange={field.onChange}
                                                        placeholder="Allergènes..."
                                                        className="text-sm min-h-[36px] py-1 flex-1"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="diets"
                                        render={({ field }) => (
                                            <FormItem className="space-y-0 flex items-center gap-2">
                                                <Leaf className="h-4 w-4 text-slate-400 flex-none" />
                                                <FormControl>
                                                    <MultiSelect
                                                        selected={field.value || []}
                                                        options={dietOptions}
                                                        onChange={field.onChange}
                                                        placeholder="Régimes Incompatibles (NON Compatible)..."
                                                        className="text-sm min-h-[36px] py-1 flex-1"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                        </div>
                    </div>

                    {/* Collapsible Full-Width Steps Card */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                        <Card className="border-none shadow-md">
                            <CardHeader
                                className="bg-slate-50/50 border-b py-3 px-6 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                onClick={() => setIsStepsOpen(!isStepsOpen)}
                            >
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-serif text-lg text-slate-800">Préparation</CardTitle>
                                    <div className="text-slate-400">
                                        {isStepsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </div>
                                </div>
                            </CardHeader>
                            {isStepsOpen && (
                                <CardContent className="p-6 space-y-6">
                                    {stepFields.length === 0 && (
                                        <div className="text-center py-6 text-slate-400 text-sm">
                                            Aucune étape de préparation. Ajoutez-en une si nécessaire.
                                        </div>
                                    )}
                                    {stepFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-start group">
                                            <div className="flex-none h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 mt-2 shadow-sm text-xs">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4 relative">
                                                <FormField
                                                    control={form.control}
                                                    name={`steps.${index}.instruction_text`}
                                                    render={({ field: txtField }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Textarea
                                                                        className="min-h-[80px] border-none shadow-none resize-none focus:ring-0 p-0 text-sm"
                                                                        placeholder={`Décrivez l'étape ${index + 1}...`}
                                                                        {...txtField}
                                                                    />
                                                                    <SpeechButton
                                                                        className="absolute right-0 bottom-0 opacity-50 hover:opacity-100 transition-opacity scale-75 origin-bottom-right"
                                                                        onStarted={() => {
                                                                            dictationBaseText.current = txtField.value || "";
                                                                        }}
                                                                        onTranscript={(text) => {
                                                                            const spacer = dictationBaseText.current && !dictationBaseText.current.endsWith(' ') ? ' ' : '';
                                                                            txtField.onChange(dictationBaseText.current + spacer + text);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`steps.${index}.image_url`}
                                                    render={({ field: imgField }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <ImageUpload
                                                                    value={imgField.value || ""}
                                                                    onChange={imgField.onChange}
                                                                    onRemove={() => imgField.onChange("")}
                                                                    className="h-24 w-32 rounded-md bg-slate-50 border-dashed"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 h-6 w-6" onClick={() => removeStep(index)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="ml-10 border-dashed h-8 text-xs"
                                        onClick={() => appendStep({ step_order: stepFields.length + 1, instruction_text: "", image_url: "" })}
                                    >
                                        <Plus className="mr-2 h-3 w-3" /> Ajouter étape
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
}
