import { useQuery } from "@tanstack/react-query"
import { User } from "@/types/auth.types"
import VITE_GATEWAY_API_URL from '@/config/api';

export function useListUsers() {
    return useQuery<User[], Error>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/users`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data
        },
    })
}
