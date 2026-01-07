import { useQuery } from "@tanstack/react-query";
import VITE_GATEWAY_API_URL from "@/config/api";
import { getAuthHeaders } from "@/utils/authHeaders";

export interface Day {
    id: string;
    date: string;
    lective: boolean;
    dayCharacter: string;
    comment: string;
}

/**
 * Hook to fetch days for a specific calendar
 */
export function useCalendarDays(calendarId: string | null) {
    return useQuery<Day[], Error>({
        queryKey: ["calendar-days", calendarId],
        queryFn: async () => {
            if (!calendarId) return [];

            const res = await fetch(
                `${VITE_GATEWAY_API_URL}/calendar/${calendarId}/days`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!res.ok) throw new Error(`Error ${res.status}`);
            const body = await res.json();
            return body.data || [];
        },
        enabled: !!calendarId,
    });
}
