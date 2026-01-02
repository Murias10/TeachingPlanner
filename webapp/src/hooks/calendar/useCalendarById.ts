import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/types/Calendar";
import VITE_GATEWAY_API_URL from "@/config/api";
import { getAuthHeaders } from "@/utils/authHeaders";

/**
 * Hook to fetch a specific calendar by its ID
 * Includes charactersInUse field
 */
export function useCalendarById(calendarId: string | null) {
    return useQuery<Calendar, Error>({
        queryKey: ["calendar", calendarId],
        queryFn: async () => {
            if (!calendarId) throw new Error("Calendar ID is required");

            const res = await fetch(
                `${VITE_GATEWAY_API_URL}/calendar/${calendarId}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!res.ok) throw new Error(`Error ${res.status}`);
            const body = await res.json();
            return body.data;
        },
        enabled: !!calendarId,
        retry: (failureCount, error) => {
            // Reintentar hasta 3 veces si es un 404 (calendario aún no disponible)
            if (error.message.includes('404') && failureCount < 3) {
                return true;
            }
            // No reintentar para otros errores
            return false;
        },
        retryDelay: (attemptIndex) => {
            // Esperar 500ms, 1000ms, 1500ms entre reintentos
            return Math.min(1000 * attemptIndex, 1500);
        },
    });
}
