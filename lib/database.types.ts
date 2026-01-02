export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            ingredients: {
                Row: {
                    id: string
                    name: string
                    category: string | null
                    supplier: string | null
                    price_per_unit: number
                    unit: string
                    image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category?: string | null
                    supplier?: string | null
                    price_per_unit?: number
                    unit: string
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string | null
                    supplier?: string | null
                    price_per_unit?: number
                    unit?: string
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            recipes: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    base_servings: number
                    total_cost: number | null
                    target_margin: number | null
                    image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    base_servings?: number
                    total_cost?: number | null
                    target_margin?: number | null
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    base_servings?: number
                    total_cost?: number | null
                    target_margin?: number | null
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            recipe_items: {
                Row: {
                    id: string
                    recipe_id: string
                    ingredient_id: string
                    quantity_needed: number
                    unit: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    recipe_id: string
                    ingredient_id: string
                    quantity_needed: number
                    unit: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    recipe_id?: string
                    ingredient_id?: string
                    quantity_needed?: number
                    unit?: string
                    created_at?: string
                }
            }
            recipe_steps: {
                Row: {
                    id: string
                    recipe_id: string
                    step_order: number
                    instruction_text: string
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    recipe_id: string
                    step_order: number
                    instruction_text: string
                    image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    recipe_id?: string
                    step_order?: number
                    instruction_text?: string
                    image_url?: string | null
                    created_at?: string
                }
            }
            dietary_tags: {
                Row: {
                    id: string
                    name: string
                    type: 'allergen' | 'diet'
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: 'allergen' | 'diet'
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: 'allergen' | 'diet'
                    created_at?: string
                }
            }
            ingredient_tags: {
                Row: {
                    ingredient_id: string
                    tag_id: string
                }
                Insert: {
                    ingredient_id: string
                    tag_id: string
                }
                Update: {
                    ingredient_id?: string
                    tag_id?: string
                }
            }
            recipe_tags: {
                Row: {
                    recipe_id: string
                    tag_id: string
                }
                Insert: {
                    recipe_id: string
                    tag_id: string
                }
                Update: {
                    recipe_id?: string
                    tag_id?: string
                }
            }
            menus: {
                Row: {
                    id: string
                    title: string
                    start_date: string | null
                    end_date: string | null
                    guest_count: number | null
                    status: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    start_date?: string | null
                    end_date?: string | null
                    guest_count?: number | null
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    start_date?: string | null
                    end_date?: string | null
                    guest_count?: number | null
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            menu_items: {
                Row: {
                    id: string
                    menu_id: string
                    recipe_id: string | null
                    custom_label: string | null
                    meal_type: string | null
                    day_date: string | null
                    servings_override: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    menu_id: string
                    recipe_id?: string | null
                    custom_label?: string | null
                    meal_type?: string | null
                    day_date?: string | null
                    servings_override?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    menu_id?: string
                    recipe_id?: string | null
                    custom_label?: string | null
                    meal_type?: string | null
                    day_date?: string | null
                    servings_override?: number | null
                    created_at?: string
                }
            }
            shopping_lists: {
                Row: {
                    id: string
                    title: string
                    menu_id: string | null
                    status: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    menu_id?: string | null
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    menu_id?: string | null
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            shopping_list_items: {
                Row: {
                    id: string
                    list_id: string
                    ingredient_id: string | null
                    custom_item_name: string | null
                    quantity: number
                    unit: string | null
                    is_checked: boolean | null
                    supplier_override: string | null
                    price_override: number | null
                    category: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    list_id: string
                    ingredient_id?: string | null
                    custom_item_name?: string | null
                    quantity?: number
                    unit?: string | null
                    is_checked?: boolean | null
                    supplier_override?: string | null
                    price_override?: number | null
                    category?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    list_id?: string
                    ingredient_id?: string | null
                    custom_item_name?: string | null
                    quantity?: number
                    unit?: string | null
                    is_checked?: boolean | null
                    supplier_override?: string | null
                    price_override?: number | null
                    category?: string | null
                    created_at?: string
                }
            }
            suppliers: {
                Row: {
                    id: string
                    name: string
                    contact_name: string | null
                    email: string | null
                    phone: string | null
                    address: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    contact_name?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    contact_name?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            ingredient_suppliers: {
                Row: {
                    id: string
                    ingredient_id: string
                    supplier_id: string
                    supplier_product_code: string | null
                    price: number
                    unit_size: number | null
                    unit_type: string | null
                    is_preferred: boolean | null
                    last_updated: string
                }
                Insert: {
                    id?: string
                    ingredient_id: string
                    supplier_id: string
                    supplier_product_code?: string | null
                    price: number
                    unit_size?: number | null
                    unit_type?: string | null
                    is_preferred?: boolean | null
                    last_updated?: string
                }
                Update: {
                    id?: string
                    ingredient_id?: string
                    supplier_id?: string
                    supplier_product_code?: string | null
                    price?: number
                    unit_size?: number | null
                    unit_type?: string | null
                    is_preferred?: boolean | null
                    last_updated?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

