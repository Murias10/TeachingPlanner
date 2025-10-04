import { useQuery } from "@tanstack/react-query"
import { Degree } from "@/types/Degree"
import VITE_GATEWAY_API_URL from '@/config/api';

export function useDegrees() {
    return useQuery<Degree[], Error>({
        queryKey: ["degrees"],
        queryFn: async () => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/degrees`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.degrees
        },
        staleTime: 5 * 60_000,
    })
}
