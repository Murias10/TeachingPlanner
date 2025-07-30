import { useQuery } from "@tanstack/react-query"
import { useDegree } from "@/hooks/useDegree"

export interface Subject {
    id: string
    acronym: string
    semester: number
    year: number
    name: string
    siesCode: string
}

export function useSubjects() {
    const { selectedDegree } = useDegree()
    const isFiltered = selectedDegree && selectedDegree !== "all"
    return useQuery<Subject[], Error>({
        queryKey: ["subjects", selectedDegree],
        enabled: selectedDegree !== undefined, // solo desactiva si es undefined
        queryFn: async () => {
            const url = isFiltered
                ? `http://localhost:8080/subjects/degree/${selectedDegree}`
                : `http://localhost:8080/subjects` // sin filtro

            const res = await fetch(url)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.subjects
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
