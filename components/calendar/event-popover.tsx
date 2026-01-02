"use client";

import { useState } from "react";
import { Event } from "@/lib/types/calendar";
import { updateEvent, deleteEvent } from "@/lib/api/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Trash2, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EventPopoverProps {
    event: Event;
    children: React.ReactNode;
    onUpdate: () => void;
}

export function EventPopover({ event, children, onUpdate }: EventPopoverProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Voulez-vous vraiment supprimer cet événement et tous ses menus ?")) return;
        setLoading(true);
        try {
            await deleteEvent(event.id);
            toast.success("Événement supprimé");
            setOpen(false);
            onUpdate();
        } catch (err) {
            console.error(err);
            toast.error("Erreur de suppression");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const start_date = formData.get("start_date") as string;
        const end_date = formData.get("end_date") as string;

        try {
            await updateEvent(event.id, { start_date, end_date });
            toast.success("Dates mises à jour");
            setOpen(false);
            onUpdate();
        } catch (err) {
            console.error(err);
            toast.error("Erreur de mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <h4 className="font-medium text-slate-900 leading-tight">{event.title}</h4>
                        <Link href={`/calendar/${event.id}`}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="start" className="text-xs text-slate-500">Début</Label>
                                <Input id="start" name="start_date" type="date" defaultValue={event.start_date} className="h-7 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="end" className="text-xs text-slate-500">Fin</Label>
                                <Input id="end" name="end_date" type="date" defaultValue={event.end_date} className="h-7 text-xs" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Button type="submit" size="sm" className="flex-1 h-7 text-xs" disabled={loading}>
                                {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                Mettre à jour
                            </Button>
                            <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={handleDelete} disabled={loading}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </form>
                </div>
            </PopoverContent>
        </Popover>
    );
}
