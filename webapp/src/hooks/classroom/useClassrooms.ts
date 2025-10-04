import { useQuery } from "@tanstack/react-query"
import { Classroom } from "@/types/Classroom"
import VITE_GATEWAY_API_URL from "@/config/api"

export function useClassrooms() {
    return useQuery<Classroom[], Error>({
        queryKey: ["classrooms"],
        queryFn: async () => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/classrooms`)

            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.classrooms
        },
        staleTime: 5 * 60_000,
    })
}