import { useQuery } from "@tanstack/react-query"
import { useDegree } from "@/hooks/useDegree"

export interface Course {
    id: string
    idDegree: string
    startYear: number
    endYear: number
    state: "success" | "processing" | "failed"
    email: string
}

export function useCourses() {
    const { selectedDegree } = useDegree()

    const isFiltered = selectedDegree && selectedDegree !== "all"

    return useQuery<Course[], Error>({
        queryKey: ["courses", selectedDegree],
        enabled: selectedDegree !== undefined, // solo desactiva si es undefined
        queryFn: async () => {
            const url = isFiltered
                ? `http://localhost:8080/courses/degree/${selectedDegree}`
                : `http://localhost:8080/courses` // sin filtro

            const res = await fetch(url)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.courses
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
