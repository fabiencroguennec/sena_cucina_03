
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Define interface locally if needed, or stick to simple objects
interface PdfItem {
    category: string;
    name: string;
    quantity: number;
    unit: string;
    is_purchased?: boolean;
}

export function exportShoppingListPDF(title: string, items: PdfItem[]) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 20);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);

    // Group items by category
    const grouped: Record<string, PdfItem[]> = {};
    items.forEach(item => {
        const cat = item.category || 'Divers';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    // Prepare table data
    const tableBody: any[] = [];

    Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).forEach(([category, catItems]) => {
        // Category Header Row
        tableBody.push([{ content: category.toUpperCase(), colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [60, 60, 60] } }]);

        // Items
        catItems.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
            tableBody.push([
                item.name,
                Number(item.quantity).toFixed(1).replace(/\.0$/, ''),
                item.unit,
                item.is_purchased ? '[X]' : '[ ]' // Simple text-based checkbox
            ]);
        });
    });

    autoTable(doc, {
        startY: 35,
        head: [['Article', 'Quantité', 'Unité', 'Fait']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' }, // Primary blue-ish
        columnStyles: {
            0: { cellWidth: 'auto' }, // Name
            1: { cellWidth: 25, halign: 'right' }, // Qty
            2: { cellWidth: 25 }, // Unit
            3: { cellWidth: 20, halign: 'center' } // Checkbox
        },
        alternateRowStyles: { fillColor: [255, 255, 255] }
    });

    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}

export function exportRecipePDF(recipeTitle: string, servings: number, items: { name: string, quantity: number, unit: string }[]) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(recipeTitle, 14, 20);

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Ingrédients pour ${servings} personnes`, 14, 28);

    // Date
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 34);

    // Table Data
    const tableBody = items.map(item => [
        item.name,
        Number(item.quantity).toFixed(1).replace(/\.0$/, ''),
        item.unit
    ]);

    autoTable(doc, {
        startY: 40,
        head: [['Ingrédient', 'Quantité', 'Unité']],
        body: tableBody,
        theme: 'striped',
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' }, // Emerald green for recipes
        columnStyles: {
            1: { halign: 'right', cellWidth: 30 },
            2: { cellWidth: 30 }
        }
    });

    doc.save(`${recipeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ingredients.pdf`);
}


// --- Daily Shopping List Export ---

interface DailyExportProps {
    eventName: string;
    date: Date; // The specific day being viewed
    guestCount: number;
    items: PdfItem[];
    eventImageUrl?: string;
    allergens?: string[];
    diets?: string[];
}

// Format: YYYYMMDD_[EventTitle]_[Date]_v{Timestamp}.pdf 
// If Date is "FULL" (conceptually), but here it's Daily, so Date is "YYYYMMDD".
// Wait, user said "date selectionnée (mettre FULL si liste de course de tout l'evenement)" 
// so for "Global" list we can assume Date is null or handled differently, but here it's Daily.
// Filename Date part: User probably means the specific date like "20240101".
export async function exportDailyShoppingListPDF({ eventName, date, guestCount, items, eventImageUrl, allergens = [], diets = [] }: DailyExportProps) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header (Image + Title)
    // We attempt to load image if provided
    let startY = 20;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(eventName, 14, startY);

    // Subtitle / Date
    const dateStr = format(date, 'EEEE d MMMM yyyy', { locale: fr });
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), 14, startY + 7);

    // Guest Count Badge (Simulated)
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.roundedRect(14, startY + 12, 30, 8, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`${guestCount} pers.`, 16, startY + 17);

    startY += 30;

    // Allergens/Diets area
    if (allergens.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(249, 115, 22); // Orange 500
        doc.text(`Allergènes: ${allergens.join(', ')}`, 14, startY);
        startY += 6;
    }

    // 2. Table
    // Group items
    const grouped: Record<string, PdfItem[]> = {};
    items.forEach(item => {
        const cat = item.category || 'Divers';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    const tableBody: any[] = [];
    Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).forEach(([category, catItems]) => {
        tableBody.push([{ content: category.toUpperCase(), colSpan: 3, styles: { fillColor: [248, 250, 252], fontStyle: 'bold', textColor: [51, 65, 85] } }]);
        catItems.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
            tableBody.push([
                item.name,
                Number(item.quantity).toFixed(1).replace(/\.0$/, ''),
                item.unit
            ]);
        });
    });

    autoTable(doc, {
        startY: startY,
        head: [['Ingrédient', 'Quantité', 'Unité']],
        body: tableBody,
        theme: 'plain', // Cleaner look like event cards
        styles: { fontSize: 10, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold', lineWidth: 0 },
        columnStyles: {
            1: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
            2: { cellWidth: 20, textColor: [100, 116, 139] }
        },
    });

    // Filename Construction
    // YYYYMMDD (Creation) _ EventName _ DateSelected _ Version
    // Creation Date: Today
    const creationDate = format(new Date(), 'yyyyMMdd');
    const selectedDate = format(date, 'yyyyMMdd');
    const cleanEventName = eventName.replace(/[^a-z0-9]/gi, '').toUpperCase();
    const version = Date.now().toString().slice(-6); // Simple versioning using timestamp suffix

    const filename = `${creationDate}_${cleanEventName}_${selectedDate}_v${version}.pdf`;

    doc.save(filename);
}
