import { useQuery } from "@tanstack/react-query"

export interface Classroom {
    id: string
    code: string
    gisUrl: string
}

export function useClassrooms() {
    return useQuery<Classroom[], Error>({
        queryKey: ["classrooms"],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/classrooms`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.classrooms
        },
        staleTime: 5 * 60_000,
    })
}
