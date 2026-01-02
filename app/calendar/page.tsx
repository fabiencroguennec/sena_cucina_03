"use client";

import { useEffect, useState } from "react";
import { getEvents, createEvent } from "@/lib/api/calendar";
import { Event } from "@/lib/types/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthView } from "@/components/calendar/month-view";
import { Copy, Rss } from "lucide-react";
import { EventForm } from "@/components/calendar/event-form";
import { EventList } from "@/components/calendar/event-list";
import { Switch } from "@/components/ui/switch";
import { EventWizard } from "@/components/calendar/event-wizard";

import { useAssistantMode } from "@/components/assistant-context";

export default function CalendarPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Assistant Mode State from Context
    const { isAssistantMode } = useAssistantMode();
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchEvents();
    }, []);

    const [prefilledData, setPrefilledData] = useState<Partial<Event> | undefined>(undefined);

    const fetchEvents = () => {
        getEvents()
            .then(setEvents)
            .catch((err) => console.error("Failed to fetch events", err))
            .finally(() => setLoading(false));
    };

    const handleRangeSelect = (start: Date, end: Date) => {
        setPrefilledData({
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0]
        });
        if (isAssistantMode) {
            setIsWizardOpen(true);
        } else {
            setIsCreateOpen(true);
        }
    };

    // Reset prefilled data when dialog closes (optional, but good practice)
    useEffect(() => {
        if (!isCreateOpen && !isWizardOpen) setPrefilledData(undefined);
    }, [isCreateOpen, isWizardOpen]);

    const handleCreateEvent = async (data: Partial<Event>) => {
        console.log("Creating event with data:", data);
        try {
            const newEvent = await createEvent({
                ...data,
                // Ensure defaults if missing (though form usage should cover it)
                color: data.color || '#3b82f6'
            });
            setIsCreateOpen(false);
            fetchEvents();
            router.push(`/calendar/${newEvent.id}`);
            toast.success("Événement créé avec succès");
        } catch (err: any) {
            console.error("Full Error Object:", err);
            if (typeof err === 'object') {
                console.error("Error Details:", JSON.stringify(err, null, 2));
                if (err.message) console.error("Error Message:", err.message);
                if (err.hint) console.error("Error Hint:", err.hint);
                if (err.details) console.error("Error DB Details:", err.details);
            }
            toast.error("Erreur lors de la création de l'événement: " + (err.message || "Inconnue"));
        }
    };

    const handleCopyFeed = () => {
        const url = window.location.origin + "/api/calendar/feed";
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url)
                .then(() => toast.success("Lien iCal copié !"))
                .catch(() => prompt("Copiez le lien iCal :", url));
        } else {
            prompt("Copiez le lien iCal :", url);
        }
    };

    return (
        <div className="space-y-6 container mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="h-8 w-8 text-primary" />
                        Calendrier
                    </h1>
                    <p className="text-slate-500 mt-1">Gérez vos événements, séminaires et retraites.</p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCopyFeed}
                        className="cursor-pointer active:scale-95 transition-transform"
                    >
                        <Rss className="h-4 w-4 mr-2" />
                        Sync Google Calendar
                    </Button>

                    <Button onClick={() => isAssistantMode ? setIsWizardOpen(true) : setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel Événement
                    </Button>

                    {/* Standard Dialog */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Créer un événement</DialogTitle>
                                <DialogDescription>Remplissez les détails complets de l'événement.</DialogDescription>
                            </DialogHeader>
                            <EventForm
                                key={prefilledData ? 'prefilled' : 'default'}
                                initialData={prefilledData}
                                onSubmit={handleCreateEvent}
                                onCancel={() => setIsCreateOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Wizard Mode Overlay */}
            {isWizardOpen && (
                <EventWizard
                    initialData={prefilledData}
                    onSubmit={async (data) => {
                        await handleCreateEvent(data);
                        setIsWizardOpen(false);
                    }}
                    onClose={() => setIsWizardOpen(false)}
                />
            )}


            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">Aucun événement planifié</h3>
                    <p className="text-slate-500 mb-6">Commencez par créer votre premier événement pour organiser les menus.</p>
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline">Créer un événement</Button>
                </div>
            ) : (
                <Tabs defaultValue="month" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="cards">Cartes</TabsTrigger>
                            <TabsTrigger value="month">Mois</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="month" className="mt-0">
                        <MonthView
                            events={events}
                            onEventsChange={fetchEvents}
                            onRangeSelect={handleRangeSelect}
                        />
                    </TabsContent>

                    <TabsContent value="cards" className="mt-0">
                        <EventList events={events} onEventUpdate={fetchEvents} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
