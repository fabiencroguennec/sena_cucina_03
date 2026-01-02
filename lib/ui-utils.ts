
import { AlertTriangle, Leaf, Wheat, Milk, Nut, Fish, Egg, LucideIcon, PiggyBank, Beef, Ban, Candy, Bean, Carrot, Wine, Flower, Snail, Droplet, CircleDot, Apple, Shell, Sprout, Box, WheatOff, MilkOff } from "lucide-react";
import React from "react";

export const getIconForTag = (tagName: string, type: 'allergen' | 'diet'): LucideIcon | null => {
    const lowerName = tagName.toLowerCase();

    if (type === 'diet') {
        if (lowerName.includes('végétarien')) return Leaf;
        if (lowerName.includes('vegan')) return Sprout;
        if (lowerName.includes('sans gluten')) return WheatOff;
        if (lowerName.includes('sans lactose')) return MilkOff;
        if (lowerName.includes('keto') || lowerName.includes('paleo')) return Beef;
        if (lowerName.includes('sucre')) return Candy;
        if (lowerName.includes('porc')) return PiggyBank;
        return Ban;
    }

    // Allergens
    if (lowerName.includes('gluten') || lowerName.includes('blé')) return Wheat;
    if (lowerName.includes('lait') || lowerName.includes('lactose')) return Milk;
    if (lowerName.includes('fruit à coque') || lowerName.includes('arachide') || lowerName.includes('noix')) return Nut;
    if (lowerName.includes('poisson')) return Fish;
    if (lowerName.includes('oeuf') || lowerName.includes('œuf')) return Egg;
    if (lowerName.includes('crustacé')) return Shell;
    if (lowerName.includes('mollusque')) return Snail;
    if (lowerName.includes('soja')) return Bean;
    if (lowerName.includes('céleri')) return Carrot;
    if (lowerName.includes('moutarde')) return Droplet;
    if (lowerName.includes('sésame')) return CircleDot;
    if (lowerName.includes('sulfite')) return Wine;
    if (lowerName.includes('lupin')) return Flower;

    return AlertTriangle;
};

export const getIconForCategory = (category: string): LucideIcon => {
    switch (category) {
        case 'fruits': return Apple;
        case 'legumes': return Carrot;
        case 'viande': return Beef;
        case 'poissons': return Fish;
        case 'fruits_de_mer': return Shell;
        case 'produits_laitiers': return Milk;
        case 'epices_herbes': return Sprout;
        case 'cereales_legumineuses': return Wheat;
        case 'sucre': return Candy;
        case 'noix_oleagineux': return Nut;
        case 'autres': return Box;
        default: return Box;
    }
};
