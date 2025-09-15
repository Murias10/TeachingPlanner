import { useQuery } from "@tanstack/react-query"
import { Course } from "@/types/Course"

export function useCoursesByDegreeAcronym(acronym: string | null) {

    return useQuery<Course[], Error>({
        queryKey: ["courses", "acronym", acronym],
        enabled: !!acronym, // solo se activa si hay degree seleccionado
        queryFn: async () => {
            if (!acronym) {
                throw new Error("acronym is required");
            }
            const res = await fetch(`http://localhost:8080/courses/degree/acronym/${acronym}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.courses
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
