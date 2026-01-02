export type Event = {
    id: string;
    title: string;
    start_date: string; // ISO Date string
    end_date: string;   // ISO Date string
    color?: string;
    guest_count: number;
    company_name?: string;
    image_url?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    allergens?: string[];
    diets?: Record<string, number>; // e.g. { "Vegetarian": 5 }
    notes?: string;
    selling_price?: number;
    created_at?: string;
    updated_at?: string;
};

export type EventMeal = {
    id: string;
    event_id: string;
    date: string; // ISO Date string
    meal_type: string;
    recipe_id: string;
    target_servings: number;
    target_servings_small?: number;
    target_servings_large?: number;
    position: number;
    meal_time?: string; // e.g. "12:30"
    order_in_slot?: number;
    created_at?: string;

    // Joined fields
    recipes?: {
        id: string;
        title: string;
        image_url: string;
        base_servings: number;
        base_servings_small?: number;
        total_cost: number;
        target_margin: number;
        recipe_items: {
            id: string;
            quantity_needed: number;
            ingredients: {
                id: string;
                name: string;
                category: string;
                unit: string;
                price_per_unit?: number;
            } | null;
        }[];
    };
    events?: Partial<Event>;

    // Joined fields
    meal_ingredients?: {
        id: string;
        ingredient_id: string;
        quantity: number;
        unit: string;
        created_at: string;
        ingredients?: {
            id: string;
            name: string;
            unit: string;
            price_per_unit: number;
            category: string;
        };
    }[];
};

export type ShoppingListItem = {
    id: string;
    event_id: string;
    ingredient_id?: string;
    manual_item_name?: string;
    quantity: number;
    unit: string;
    is_purchased: boolean;
    created_at?: string;
    updated_at?: string;

    // Procurement / History
    supplier_id?: string;
    price_paid?: number;
    quantity_bought?: number;
    unit_bought?: string;
    price_per_unit_override?: number;
    quality_rating?: number;
    purchase_date?: string;

    // Joined fields
    ingredients?: {
        id: string;
        name: string;
        category: string;
    };
    suppliers?: {
        id: string;
        name: string;
    };
};

export type CalendarView = 'month' | 'week' | 'list';
