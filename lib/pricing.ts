
/**
 * Calculates the cost of an ingredient usage based on its unit and price per unit.
 * Handles conversions between:
 * - Weight: kg, g, mg
 * - Volume: l, cl, ml
 * 
 * @param ingredientPrice Price per base unit (e.g. per kg, per l)
 * @param ingredientUnit Base unit of the ingredient (e.g. 'kg', 'l', 'pcs')
 * @param usedQuantity Quantity used in the recipe
 * @param usedUnit Unit used in the recipe
 * @returns The calculate cost
 */
import { convertQuantity } from "./conversions";

/**
 * Calculates the cost of an ingredient usage based on its unit and price per unit.
 * Handles conversions between:
 * - Weight: kg, g, mg, cac, cas
 * - Volume: l, cl, ml
 * 
 * @param ingredientPrice Price per base unit (e.g. per kg, per l)
 * @param ingredientUnit Base unit of the ingredient (e.g. 'kg', 'l', 'pcs')
 * @param usedQuantity Quantity used in the recipe
 * @param usedUnit Unit used in the recipe
 * @returns The calculate cost
 */
export const getConvertedCost = (
    ingredientPrice: number,
    ingredientUnit: string,
    usedQuantity: number,
    usedUnit: string
) => {
    // Convert the used quantity into the ingredient's unit
    // Example: Used 500g, Price is per kg.
    // convertQuantity(500, 'g', 'kg') -> 0.5
    // Cost = 0.5 * PricePerKg
    const quantityInBase = convertQuantity(usedQuantity, usedUnit, ingredientUnit);
    return quantityInBase * ingredientPrice;
};
