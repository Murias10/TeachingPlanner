import { useQuery } from "@tanstack/react-query";
import { CalendarEventsResponse } from "@/types/CalendarEvent";
import VITE_GATEWAY_API_URL from "@/config/api";

export function usePendingRequestsAsEvents(calendarId: string | null) {
    return useQuery<CalendarEventsResponse, Error>({
        queryKey: ["pending-request-events", calendarId],
        queryFn: async () => {
            if (!calendarId) throw new Error("Calendar ID is required");

            const res = await fetch(`${VITE_GATEWAY_API_URL}/calendar/${calendarId}/pending-requests`);

            if (!res.ok) throw new Error(`Error ${res.status}`);

            const body = await res.json();
            return body.data;
        },
        enabled: !!calendarId,
    });
}
