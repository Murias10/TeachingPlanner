// hooks/useCourses.ts
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

    return useQuery<Course[], Error>({
        queryKey: ["courses", selectedDegree],
        enabled: !!selectedDegree, // solo ejecutar si hay un grado seleccionado
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/courses/degree/${selectedDegree}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.courses
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
