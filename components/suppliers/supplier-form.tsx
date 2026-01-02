
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have this, or use Textarea from html
import { toast } from "sonner";
import { Supplier, updateSupplier, createSupplier } from "@/lib/api/suppliers";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Schema
const supplierSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    contact_name: z.string().optional().or(z.literal("")),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    remarks: z.string().optional().or(z.literal("")),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
    initialData?: Supplier;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function SupplierForm({ initialData, onSuccess, onCancel }: SupplierFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: initialData?.name || "",
            contact_name: initialData?.contact_name || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            remarks: initialData?.remarks || "",
        },
    });

    async function onSubmit(data: SupplierFormValues) {
        setLoading(true);
        try {
            if (initialData) {
                await updateSupplier(initialData.id, data);
                toast.success("Fournisseur mis à jour");
            } else {
                await createSupplier(data);
                toast.success("Fournisseur créé");
            }
            onSuccess?.();
            onCancel?.();
        } catch (error: any) {
            console.error(error);
            toast.error("Erreur: " + (error.message || "Impossible d'enregistrer"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom du fournisseur</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Métro" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom du contact</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Jean Dupont" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="contact@fournisseur.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Téléphone</FormLabel>
                                <FormControl>
                                    <Input placeholder="01 23 45 67 89" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Adresse</FormLabel>
                                <FormControl>
                                    <Input placeholder="123 Rue du Commerce..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Remarques</FormLabel>
                                <FormControl>
                                    <Input placeholder="Horaires de livraison, conditions..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Mettre à jour" : "Créer le fournisseur"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
