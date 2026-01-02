
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

// Manually extending Supplier type until codegen is run
export type Supplier = Database['public']['Tables']['suppliers']['Row'] & { remarks?: string | null };
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'] & { remarks?: string | null };
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'] & { remarks?: string | null };

export type IngredientSupplier = Database['public']['Tables']['ingredient_suppliers']['Row'] & {
    suppliers?: Supplier | null;
};

export async function getSuppliers() {
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data as Supplier[];
}

export async function getSupplierById(id: string) {
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Supplier;
}

export async function createSupplier(supplier: SupplierInsert) {
    const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier as any)
        .select()
        .single();

    if (error) throw error;
    return data as Supplier;
}

export async function updateSupplier(id: string, updates: SupplierUpdate) {
    const { data, error } = await supabase
        .from('suppliers')
        // @ts-ignore
        .update(updates)
        .eq('id', id)
        .select()
        .single();


    if (error) throw error;
    return data;
}

export async function deleteSupplier(id: string) {
    const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
