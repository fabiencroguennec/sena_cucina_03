import { supabase } from "@/lib/supabase";

export async function getTags(type?: 'allergen' | 'diet' | 'category' | 'theme') {
    let query = supabase
        .from('dietary_tags')
        .select('*')
        .order('name', { ascending: true });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function createTag(name: string, type: 'allergen' | 'diet' | 'category' | 'theme') {
    const { data, error } = await supabase
        .from('dietary_tags')
        // @ts-ignore
        .insert({ name, type })
        .select()
        .single();
    if (error) throw error;
    return data;
}
