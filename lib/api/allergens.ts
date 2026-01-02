import { supabase } from "@/lib/supabase";

export type Allergen = {
    id: string;
    name: string;
};

export async function getAllergens() {
    const { data, error } = await supabase
        .from('dietary_tags')
        .select('id, name')
        .eq('type', 'allergen')
        .order('name');

    if (error) throw error;
    // @ts-ignore
    return data as Allergen[];
}
