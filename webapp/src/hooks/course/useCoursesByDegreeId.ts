import { useQuery } from "@tanstack/react-query"
import { Course } from "@/types/Course"
import VITE_GATEWAY_API_URL from "@/config/api"

export function useCoursesByDegreeId(degreeId: string | null) {

    return useQuery<Course[], Error>({
        queryKey: ["courses", "degreeId", degreeId],
        enabled: !!degreeId, // solo se activa si hay degree seleccionado
        queryFn: async () => {
            if (!degreeId) {
                throw new Error("degreeId is required");
            }
            const res = await fetch(`${VITE_GATEWAY_API_URL}/courses/degree/${degreeId}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.courses
        },
        // Usar el staleTime por defecto (0) definido en queryClient
    })
}
