import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/types/Calendar";
import VITE_GATEWAY_API_URL from "@/config/api";
import { getAuthHeaders } from "@/utils/authHeaders";

/**
 * Hook to fetch all calendars for a specific degree
 */
export function useCalendarsByDegree(degreeId: string | null) {
    return useQuery<Calendar[], Error>({
        queryKey: ["calendars", "degree", degreeId],
        queryFn: async () => {
            if (!degreeId) return [];

            const res = await fetch(
                `${VITE_GATEWAY_API_URL}/degrees/${degreeId}/calendars`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!res.ok) throw new Error(`Error ${res.status}`);
            const body = await res.json();
            return body.data || [];
        },
        enabled: !!degreeId,
    });
}
