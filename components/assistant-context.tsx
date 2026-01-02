"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AssistantContextType {
    isAssistantMode: boolean;
    toggleAssistantMode: () => void;
    setAssistantMode: (value: boolean) => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
    // Default to true as requested by user ("activer par defaut")
    const [isAssistantMode, setIsAssistantMode] = useState(true);

    // Optional: Persist in localStorage if desired, but for now simple state
    useEffect(() => {
        const stored = localStorage.getItem("assistant-mode");
        if (stored !== null) {
            setIsAssistantMode(stored === "true");
        }
    }, []);

    const toggleAssistantMode = () => {
        setIsAssistantMode(prev => {
            const newValue = !prev;
            localStorage.setItem("assistant-mode", String(newValue));
            return newValue;
        });
    };

    const setAssistantMode = (value: boolean) => {
        setIsAssistantMode(value);
        localStorage.setItem("assistant-mode", String(value));
    };

    return (
        <AssistantContext.Provider value={{ isAssistantMode, toggleAssistantMode, setAssistantMode }}>
            {children}
        </AssistantContext.Provider>
    );
}

export function useAssistantMode() {
    const context = useContext(AssistantContext);
    if (context === undefined) {
        throw new Error("useAssistantMode must be used within an AssistantProvider");
    }
    return context;
}
