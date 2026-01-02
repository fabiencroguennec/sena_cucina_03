"use client";

import { useState, useMemo, useEffect } from "react";
import { Event } from "@/lib/types/calendar";
import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, format, isSameMonth, isSameDay,
    addMonths, subMonths, isWithinInterval, parseISO,
    differenceInCalendarDays, addDays
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPreview } from "./calendar-preview";
import { EventPlannerView } from "./event-planner-view";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { EventCard } from "./event-card";

interface MonthViewProps {
    events: Event[];
    onEventsChange?: () => void;
    onRangeSelect?: (start: Date, end: Date) => void;
}

export function MonthView({ events, onEventsChange, onRangeSelect }: MonthViewProps) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedEventId(null);
    };

    const handleEventSelect = (eventId: string) => {
        setSelectedEventId(eventId);
        setSelectedDate(null);
    };

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        // Check if device supports hover (desktop usually does, mobile doesn't)
        // or if it's a coarse pointer (finger)
        const checkMobile = () => {
            const isTouch = window.matchMedia('(pointer: coarse)').matches;
            const noHover = window.matchMedia('(hover: none)').matches;
            setIsMobile(isTouch || noHover);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Scroll to preview when an event is selected
    useEffect(() => {
        if (selectedEventId) {
            // Small timeout to ensure the layout (min-height) has been applied
            const timer = setTimeout(() => {
                const element = document.getElementById('calendar-preview-anchor');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedEventId]);



    // ... (render logic)



    const startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });

    // Drag Selection State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Date | null>(null);
    const [dragEnd, setDragEnd] = useState<Date | null>(null);

    const onMouseDown = (date: Date) => {
        setIsDragging(true);
        setDragStart(date);
        setDragEnd(date);
    };

    const onMouseEnter = (date: Date) => {
        if (isDragging && dragStart) {
            setDragEnd(date);
        }
    };

    const onMouseUp = () => {
        if (isDragging && dragStart && dragEnd) {
            setIsDragging(false);
            // If strictly different days, trigger selection
            if (!isSameDay(dragStart, dragEnd)) {
                // Ensure chronological order
                const start = dragStart < dragEnd ? dragStart : dragEnd;
                const end = dragStart < dragEnd ? dragEnd : dragStart;
                onRangeSelect?.(start, end);
            } else {
                // Just a click
                handleDateSelect(dragStart);
            }
            setDragStart(null);
            setDragEnd(null);
        }
    };



    const weeks = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeksArray = [];
        for (let i = 0; i < days.length; i += 7) {
            weeksArray.push(days.slice(i, i + 7));
        }
        return weeksArray;
    }, [startDate, endDate]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    return (
        <div className="space-y-6" onMouseLeave={() => {
            if (isDragging) {
                setIsDragging(false);
                setDragStart(null);
                setDragEnd(null);
            }
        }}>
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold capitalize text-slate-900 dark:text-slate-100">
                    {format(currentDate, "MMMM yyyy", { locale: fr })}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={today}>Aujourd'hui</Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid - Strip Style */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg shadow-sm overflow-hidden select-none">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => (
                        <div key={day} className="py-2 text-center text-sm font-semibold text-slate-500">
                            {day}
                        </div>
                    ))}
                </div>

                {weeks.map((weekDays, weekIdx) => {
                    // Identify events in this week
                    const weekStart = weekDays[0];
                    const weekEnd = weekDays[6];

                    // Filter events overlapping this week
                    const weekEvents = events.filter(e => {
                        const start = parseISO(e.start_date);
                        const end = parseISO(e.end_date);
                        return (start <= weekEnd && end >= weekStart);
                    });

                    // Sort by start date then length (simple heuristic for packing)
                    weekEvents.sort((a, b) => a.start_date.localeCompare(b.start_date));

                    // Basic row stacking logic could go here, but for simplicity we rely on CSS Grid packing or just vertical stack
                    // For a true "strip" that spans correctly, we need to calculate grid columns (1-7)

                    return (
                        <div key={weekIdx} className={cn("grid grid-cols-7 border-b dark:border-slate-800 min-h-[100px] relative group",
                            // Highlight the selected date's week slightly? No, keeping it subtle.
                        )}>
                            {/* Background Grid Cells */}
                            {weekDays.map((day, dayIdx) => {
                                const isSelected = isSameDay(day, selectedDate!);
                                const isInRange = isDragging && dragStart && dragEnd &&
                                    isWithinInterval(day, {
                                        start: dragStart < dragEnd ? dragStart : dragEnd,
                                        end: dragStart < dragEnd ? dragEnd : dragStart
                                    });

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onMouseDown={(e) => { e.preventDefault(); onMouseDown(day); }} // Prevent text selection
                                        onMouseEnter={() => onMouseEnter(day)}
                                        onMouseUp={onMouseUp}
                                        className={cn(
                                            "border-r dark:border-slate-800 p-1 transition-colors cursor-pointer min-h-[100px]",
                                            dayIdx === 6 && "border-r-0", // last col
                                            !isSameMonth(day, currentDate) && "bg-slate-50/50 dark:bg-slate-900/30 text-slate-300 dark:text-slate-700",
                                            isSelected ? "bg-blue-50/50 dark:bg-blue-900/20" : (isInRange ? "bg-blue-100/50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800")
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                                isSameDay(day, new Date()) ? "bg-primary text-white" : "text-slate-500 dark:text-slate-400",
                                                isSelected && !isSameDay(day, new Date()) && "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
                                                // Make range dates also look active?
                                                isInRange && !isSelected && "bg-blue-200/50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                                            )}>
                                                {format(day, "d")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Events Layer - Overlay */}
                            <div className="absolute top-8 left-0 right-0 bottom-0 px-1 pointer-events-none grid grid-cols-7 grid-rows-[repeat(auto-fill,24px)] gap-y-1">
                                {weekEvents.map(event => {
                                    const eventStart = parseISO(event.start_date);
                                    const eventEnd = parseISO(event.end_date);

                                    // Calculate effective range within this week
                                    const effectiveStart = eventStart < weekStart ? weekStart : eventStart;
                                    const effectiveEnd = eventEnd > weekEnd ? weekEnd : eventEnd;

                                    // Calculate grid columns (1-based)
                                    // differenceInCalendarDays is safer as it ignores time, purely date based.
                                    const startCol = differenceInCalendarDays(effectiveStart, weekStart) + 1;
                                    const endCol = differenceInCalendarDays(effectiveEnd, weekStart) + 2; // +1 for index, +1 for exclusive end

                                    if (startCol > 7 || endCol < 2) return null; // Should not happen with filter, but safety

                                    const EventTrigger = (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventSelect(event.id);
                                            }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/calendar/${event.id}`);
                                            }}
                                            className="z-10 block pointer-events-auto cursor-pointer relative mb-1"
                                            style={{
                                                gridColumnStart: startCol,
                                                gridColumnEnd: endCol,
                                            }}
                                        >
                                            <div
                                                className="text-xs px-2 py-0.5 rounded shadow-sm border truncate font-medium hover:brightness-95 transition-all text-white relative group"
                                                style={{
                                                    backgroundColor: event.color || '#3b82f6',
                                                    borderColor: event.color || '#3b82f6'
                                                }}
                                            >
                                                {event.title}
                                            </div>
                                        </div>
                                    );

                                    if (isMobile) {
                                        return <div key={event.id} className="contents">{EventTrigger}</div>;
                                    }

                                    return (
                                        <HoverCard key={event.id} openDelay={200} closeDelay={100}>
                                            <HoverCardTrigger asChild>
                                                {EventTrigger}
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-[320px] p-0 border-none shadow-none bg-transparent" align="start">
                                                <div className="shadow-xl rounded-xl overflow-hidden">
                                                    <EventCard
                                                        event={event}
                                                        onEdit={() => router.push(`/calendar/${event.id}`)}
                                                    />
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selected Item Preview or Full View */}
            {/* Selected Item Preview or Full View */}
            <div id="calendar-preview-anchor" className={cn("mt-8 scroll-mt-20", selectedEventId && "min-h-[600px]")}>
                <CalendarPreview
                    date={selectedDate}
                    eventId={selectedEventId}
                    onEventUpdate={onEventsChange}
                />
            </div>
        </div>
    );
}
