import { useQuery } from "@tanstack/react-query"
import { Course } from "@/types/Course"

export function useCoursesByDegreeId(degreeId: string | null) {

    return useQuery<Course[], Error>({
        queryKey: ["courses", "degreeId", degreeId],
        enabled: !!degreeId, // solo se activa si hay degree seleccionado
        queryFn: async () => {
            if (!degreeId) {
                throw new Error("degreeId is required");
            }
            const res = await fetch(`http://localhost:8080/courses/degree/${degreeId}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.courses
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
