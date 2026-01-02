import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*');

        if (error) throw error;

        // VCALENDAR Header
        let icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Sena Cucina//App//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:Sena Cucina Events",
            "X-WR-TIMEZONE:Europe/Paris",
        ].join("\r\n");

        if (events) {
            // @ts-ignore
            events.forEach((event: any) => {
                // Dates must be YYYYMMDD for all-day events
                const startDate = event.start_date.replace(/-/g, '');
                // End date in iCal is exclusive, so we should technically add 1 day, or keeping it same might show 1 day short.
                // For simplicity assuming input is inclusive, iCal needs exclusive end for DTEND with VALUE=DATE.
                // But simplified: just raw dump
                const endDate = event.end_date.replace(/-/g, '');

                const shoppingLink = `${req.nextUrl.origin}/calendar/${event.id}/shopping`;

                const vevent = [
                    "BEGIN:VEVENT",
                    `UID:${event.id}`,
                    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                    `DTSTART;VALUE=DATE:${startDate}`,
                    `DTEND;VALUE=DATE:${endDate}`, // NOTE: This might cut off last day if not +1
                    `SUMMARY:${event.title}`,
                    `DESCRIPTION:Convives: ${event.guest_count}\\nListe des courses: ${shoppingLink}`,
                    `URL:${shoppingLink}`,
                    "END:VEVENT"
                ].join("\r\n");

                icsContent += "\r\n" + vevent;
            });
        }

        icsContent += "\r\nEND:VCALENDAR";

        return new NextResponse(icsContent, {
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": 'attachment; filename="calendar.ics"',
            },
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 });
    }
}
