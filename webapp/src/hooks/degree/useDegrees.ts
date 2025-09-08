import { useQuery } from "@tanstack/react-query"
import { Degree } from "@/types/Degree"

export function useDegrees() {
    return useQuery<Degree[], Error>({
        queryKey: ["degrees"],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/degrees`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.degrees
        },
        staleTime: 5 * 60_000,
    })
}
