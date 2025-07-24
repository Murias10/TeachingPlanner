import { useQuery } from "@tanstack/react-query"

export interface Subject {
    id: string
    acronym: string
    semester: number
    year: number
    name: string
    siesCode: string
}

export function useSubjects() {
    return useQuery<Subject[], Error>({
        queryKey: ["subjects"],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/subjects`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.subjects
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
