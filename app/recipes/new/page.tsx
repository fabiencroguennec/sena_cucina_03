"use client";

import { RecipeForm } from "@/components/recipes/recipe-form";
import { RecipeWizard } from "@/components/recipes/recipe-wizard";
import { useAssistantMode } from "@/components/assistant-context";

export default function NewRecipePage() {
    const { isAssistantMode } = useAssistantMode();

    if (isAssistantMode) {
        return <RecipeWizard onClose={() => {
            // Optional: If user cancels wizard, maybe we just redirect back or show form? 
            // For now, if wizard is closed, we probably want to show the form or toggle mode?
            // Since mode is global, 'closing' might mean just showing the form temporarily or navigating away.
            // But usually Wizard 'onClose' implies cancellation. 
            // Let's assume for now it stays in wizard mode unless globally toggled, 
            // OR we could allow local override. But user asked for centralized switch.
            // If we strictly follow "Mode Assistant = Switch", then user must toggle switch to exit.
            // However, RecipeWizard likely has a "Cancel" button calling onClose.
            // If onClose is called, we should probably redirect to /recipes or show the standard form.
            // Let's toggle user back to recipes list on close for safety, or render form.
            // Given the request "Assure toi que le bouton 'nouvelle recette' soit bien affecté",
            // checking the switch is key.
            // Simplest: If wizard closes, return to form view? But that contradicts the switch.
            // Let's redirect to recipes list if cancelled, or show form?
            window.location.href = '/recipes';
        }} />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 relative">
            <RecipeForm />
        </div>
    );
}
