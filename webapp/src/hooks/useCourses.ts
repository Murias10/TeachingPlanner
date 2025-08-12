import { useQuery } from "@tanstack/react-query"
import { Course } from "@/types/Course"

export function useCourses(degreeAcronym: string) {

    return useQuery<Course[], Error>({
        queryKey: ["courses", degreeAcronym],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/courses/degree/${degreeAcronym}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.courses
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
