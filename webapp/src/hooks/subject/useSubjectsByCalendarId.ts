import { useQuery } from "@tanstack/react-query";
import { Subject } from "@/types/Subject";
import VITE_GATEWAY_API_URL from "@/config/api";

export function useSubjectsByCalendarId(calendarId: string | null) {
    return useQuery<Subject[], Error>({
        queryKey: ["subjects", "calendar", calendarId],
        enabled: !!calendarId, // solo se activa si hay calendarId válido
        queryFn: async () => {
            if (!calendarId) {
                throw new Error("calendarId is required");
            }

            const res = await fetch(`${VITE_GATEWAY_API_URL}/subjects/calendar/${calendarId}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const body = await res.json();
            return body.data.subjects;
        },
        // Usar el staleTime por defecto (0) definido en queryClient
    });
}