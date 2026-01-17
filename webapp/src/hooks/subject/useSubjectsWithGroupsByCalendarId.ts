import { useQuery } from "@tanstack/react-query"
import { Subject } from "@/types/Subject"
import VITE_GATEWAY_API_URL from "@/config/api"

export function useSubjectsWithGroupsByCalendarId(calendarId: string | null) {
    return useQuery<Subject[], Error>({
        queryKey: ["subjects", "groups", "calendar", calendarId],
        queryFn: async () => {
            if (!calendarId) {
                throw new Error("Calendar ID is required");
            }

            const res = await fetch(`${VITE_GATEWAY_API_URL}/subjects/groups/by-calendar/${calendarId}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.subjects
        },
        enabled: !!calendarId, // Solo ejecuta la query si el parámetro está disponible
        // Usar el staleTime por defecto (0) definido en queryClient
    })
}