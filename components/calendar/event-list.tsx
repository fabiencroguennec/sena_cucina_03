"use client";

import { useState } from "react";
import { Event } from "@/lib/types/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowRight, ExternalLink, Trash2, LayoutGrid, List as ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EventForm } from "./event-form";
import { updateEvent, deleteEvent } from "@/lib/api/calendar";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventCard } from "./event-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EventListProps {
    events: Event[];
    onEventUpdate: () => void;
}

export function EventList({ events, onEventUpdate }: EventListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
        try {
            await deleteEvent(id);
            toast.success("Événement supprimé");
            onEventUpdate();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleUpdate = async (id: string, data: Partial<Event>) => {
        try {
            await updateEvent(id, data);
            toast.success("Événement mis à jour");
            onEventUpdate();
            setEditingEvent(null);
        } catch (error) {
            toast.error("Erreur de modification");
            console.error(error);
        }
    };

    // Simple search filter
    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.company_name && e.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by date desc (most recent/future first usually better, or user prefers asc?) 
    // Let's stick to chronological.
    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Edit Dialog */}
                <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Modifier l'événement</DialogTitle>
                        </DialogHeader>
                        {editingEvent && (
                            <EventForm
                                initialData={editingEvent}
                                onSubmit={(data) => handleUpdate(editingEvent.id, data)}
                                onCancel={() => setEditingEvent(null)}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sortedEvents.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onDelete={() => handleDelete(event.id)}
                            onEdit={(e) => setEditingEvent(e)}
                        />
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}
