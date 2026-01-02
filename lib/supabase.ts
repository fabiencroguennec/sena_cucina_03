import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    if (typeof window !== 'undefined') {
        // Client-side: Log error but ensure no crash loop
        console.error("Supabase Env Vars missing! Check .env.local");
    }
}

// Ensure we don't pass undefined to createClient which crashes
export const supabase = createClient<Database>(supabaseUrl || '', supabaseKey || '');
