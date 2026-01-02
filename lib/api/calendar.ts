import { supabase } from '@/lib/supabase';
import { Event, EventMeal, ShoppingListItem } from '@/lib/types/calendar';

// --- Events ---

export async function getEvents() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

    if (error) throw error;
    // @ts-ignore
    return data as Event[];
}

export async function getEventById(id: string) {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    // @ts-ignore
    return data as Event;
}

export async function createEvent(event: Partial<Event>) {
    const { data, error } = await supabase
        .from('events')
        // @ts-ignore
        .insert(event)
        .select()
        .single();

    if (error) throw error;
    // @ts-ignore
    return data as Event;
}

export async function updateEvent(id: string, updates: Partial<Event>) {
    const { data, error } = await supabase
        .from('events')
        // @ts-ignore
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    // @ts-ignore
    return data as Event;
}

export async function deleteEvent(id: string) {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// --- Event Meals ---

export async function getEventMeals(eventId: string) {
    const { data, error } = await supabase
        .from('event_meals')
        .select(`
            *,
            target_servings,
            position,
            meal_time,
            meal_ingredients:event_meal_ingredients (
                id,
                ingredient_id,
                quantity,
                unit,
                created_at,
                ingredients (
                    id,
                    name,
                    unit,
                    price_per_unit,
                    category
                )
            ),
            recipes (
                *,
                recipe_tags (
                    tag_id,
                    dietary_tags (
                        id,
                        name,
                        type
                    )
                ),
                recipe_items (
                    id,
                    quantity_needed,
                    unit,
                    ingredients (
                        id,
                        name,
                        category,
                        unit,
                        price_per_unit
                    )
                )
            )
        `)
        .eq('event_id', eventId)
        .order('date', { ascending: true })
        .order('position', { ascending: true })
        .order('order_in_slot', { ascending: true });

    if (error) throw error;
    // @ts-ignore
    return data as EventMeal[];
}

export async function addEventMeal(meal: Partial<EventMeal>) {
    const { data, error } = await supabase
        .from('event_meals')
        // @ts-ignore
        .insert(meal)
        .select()
        .single();

    if (error) throw error;
    // @ts-ignore
    return data as EventMeal;
}

export async function removeEventMeal(id: string) {
    const { error } = await supabase
        .from('event_meals')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function updateEventMeal(id: string, updates: Partial<EventMeal>) {
    const { data, error } = await supabase
        .from('event_meals')
        // @ts-ignore
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    // @ts-ignore
    // @ts-ignore
    return data as EventMeal;
}

export async function updateEventMealsServings(eventId: string, newServings: number) {
    const { error } = await supabase
        .from('event_meals')
        // @ts-ignore
        .update({ target_servings: newServings })
        .eq('event_id', eventId);

    if (error) throw error;
}

// --- Event Meal Ingredients (Direct) ---

export async function addEventMealIngredient(item: { event_meal_id: string, ingredient_id: string, quantity: number, unit: string }) {
    const { data, error } = await supabase
        .from('event_meal_ingredients')
        // @ts-ignore
        .insert(item)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeEventMealIngredient(id: string) {
    const { error } = await supabase
        .from('event_meal_ingredients')
        // @ts-ignore
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function updateEventMealIngredient(id: string, updates: { quantity?: number, unit?: string }) {
    const { data, error } = await supabase
        .from('event_meal_ingredients')
        // @ts-ignore
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getMealsByDate(dateStr: string) {
    const { data, error } = await supabase
        .from('event_meals')
        .select(`
            *,
            recipes (
                id,
                title,
                image_url,
                recipe_items (
                    id,
                    quantity_needed,
                    unit,
                    ingredients (
                        id,
                        name,
                        category,
                        unit,
                        price_per_unit
                    )
                )
            ),
            meal_ingredients:event_meal_ingredients (
                id,
                ingredient_id,
                quantity,
                unit,
                ingredients (
                    id,
                    name,
                    unit,
                    price_per_unit,
                    category
                )
            ),
            events (
                id,
                title,
                color,
                guest_count
            )
        `)
        .eq('date', dateStr);

    if (error) throw error;
    // @ts-ignore
    return data as (EventMeal & { events: Event })[];
}

// --- Shopping List ---

export async function getShoppingList(eventId: string) {
    const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
            *,
            ingredients (
                id,
                name,
                category
            ),
            suppliers (
                id,
                name
            )
        `)
        .eq('event_id', eventId)
        .order('is_purchased', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) throw error;
    // @ts-ignore
    return data as ShoppingListItem[];
}

export async function upsertShoppingListItem(item: Partial<ShoppingListItem>) {
    // If it has an ID, we update, if not we create (but usually we work with IDs here or upsert)
    const { data, error } = await supabase
        .from('shopping_list_items')
        // @ts-ignore
        .upsert(item)
        .select(`
            *,
            ingredients (
                id,
                name,
                category
            ),
            suppliers (
                id,
                name
            )
        `)
        .single();

    if (error) {
        console.error("Supabase Upsert Error details:", JSON.stringify(error, null, 2));
        throw error;
    }
    // @ts-ignore
    return data as ShoppingListItem;
}

export async function toggleShoppingItem(id: string, is_purchased: boolean) {
    const { error } = await supabase
        .from('shopping_list_items')
        // @ts-ignore
        .update({ is_purchased })
        .eq('id', id);

    if (error) throw error;
}

export async function updateEventMealOrder(items: { id: string; order_in_slot: number }[]) {
    // Parallel update
    const promises = items.map(item =>
        supabase
            .from('event_meals')
            // @ts-ignore
            .update({ order_in_slot: item.order_in_slot })
            .eq('id', item.id)
    );
    await Promise.all(promises);
}
