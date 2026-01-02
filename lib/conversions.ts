
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return quantity;

    // Normalize to base units (g for mass, ml for volume)
    const toBase = (qty: number, unit: string): { type: 'mass' | 'volume' | 'other', value: number } => {
        switch (unit) {
            case 'kg': return { type: 'mass', value: qty * 1000 };
            case 'g': return { type: 'mass', value: qty };
            case 'mg': return { type: 'mass', value: qty / 1000 };
            case 'l': return { type: 'volume', value: qty * 1000 };
            case 'cl': return { type: 'volume', value: qty * 10 };
            case 'ml': return { type: 'volume', value: qty };
            case 'cac': return { type: 'mass', value: qty * 5 }; // 1 tsp = 5g (or 5ml)
            case 'cas': return { type: 'mass', value: qty * 13 }; // 1 tbsp = 13g (or 13ml)
            default: return { type: 'other', value: qty };
        }
    };

    const fromBase = toBase(quantity, fromUnit);
    const targetTypeBase = toBase(1, toUnit);

    // If 'other' (pcs, box), we cannot convert unless it's the exact same unit (handled at top).
    if (fromBase.type === 'other' || targetTypeBase.type === 'other') {
        return quantity;
    }

    // Mass <-> Volume conversion assumption: 1g = 1ml (Density = 1)
    // This allows converting 'cas' (mass) to 'l' (volume) or 'kg' (mass) to 'cl' (volume).
    const fromValue = fromBase.value;

    switch (toUnit) {
        case 'kg': return fromValue / 1000;
        case 'g': return fromValue;
        case 'mg': return fromValue * 1000;
        case 'l': return fromValue / 1000;
        case 'cl': return fromValue / 10;
        case 'ml': return fromValue;
        case 'cac': return fromValue / 5;
        case 'cas': return fromValue / 13;
        default: return quantity;
    }
}
