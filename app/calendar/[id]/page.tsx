"use client";

import { useParams } from "next/navigation";
import { EventPlannerView } from "@/components/calendar/event-planner-view";

export default function EventPlannerPage() {
    const params = useParams();
    const id = params.id as string;

    return <EventPlannerView eventId={id} />;
}
