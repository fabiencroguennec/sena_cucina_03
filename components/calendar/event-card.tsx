
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Users, Edit, Trash2, ArrowRight, Euro } from 'lucide-react';
import { Event } from '@/lib/types/calendar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EventCardProps {
    event: Event;
    onDelete?: (e: React.MouseEvent) => void;
    onEdit?: (event: Event) => void;
}

export function EventCard({ event, onDelete, onEdit }: EventCardProps) {
    const durationDays = Math.ceil((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 3600 * 24)) + 1;
    const isPast = new Date(event.end_date) < new Date();
    const isCurrent = new Date(event.start_date) <= new Date() && new Date(event.end_date) >= new Date();

    return (
        <div className="group relative bg-card text-card-foreground border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <Link href={`/calendar/${event.id}`} className="absolute inset-0 z-10">
                <span className="sr-only">Voir l'événement</span>
            </Link>

            {/* Image Section - 4:3 Aspect Ratio */}
            <div className="relative aspect-[4/3] w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
                {event.image_url ? (
                    <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300 bg-slate-100 dark:bg-slate-800">
                        <CalendarDays className="h-16 w-16 opacity-30" />
                    </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2 right-2 flex gap-1 z-20">
                    {isCurrent && <Badge className="bg-green-500 hover:bg-green-600">En cours</Badge>}
                    {isPast && <Badge variant="secondary" className="opacity-80">Terminé</Badge>}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1">
                {/* Title & Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1">
                        {event.title}
                    </h3>

                    <div className="flex flex-col items-end gap-2 z-20 relative">
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 transition-opacity">
                            {onEdit && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/5"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onEdit(event);
                                    }}
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(e);
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Company Name */}
                {event.company_name && (
                    <div className="text-sm text-slate-500 mb-3 font-medium">
                        {event.company_name}
                    </div>
                )}

                {/* Dates */}
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded -mx-2">
                    <div className="flex justify-between items-center">
                        <span>{format(new Date(event.start_date), 'd MMM', { locale: fr })}</span>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <span>{format(new Date(event.end_date), 'd MMM yyyy', { locale: fr })}</span>
                    </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500">
                    {/* Duration */}
                    <div className="flex items-center gap-1.5" title="Durée">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        <span>{durationDays} jours</span>
                    </div>

                    {/* Revenue (if available) - mimicking cost */}
                    {(event.selling_price || 0) > 0 && (
                        <div className="flex items-center gap-1.5" title="Prix de vente">
                            <Euro className="h-3.5 w-3.5 text-slate-400" />
                            <span>{event.selling_price}</span>
                        </div>
                    )}

                    {/* Servings */}
                    <div className="flex items-center gap-1.5" title="Participants">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{event.guest_count}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
