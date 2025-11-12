import { useQuery } from "@tanstack/react-query";
import { Degree } from "@/types/Degree";
import VITE_GATEWAY_API_URL from '@/config/api';

export function useDegreeByAcronym(acronym: string | null) {
    return useQuery<Degree, Error>({
        queryKey: ["degree", "acronym", acronym],
        enabled: !!acronym, // solo se activa si hay acronym válido
        queryFn: async () => {
            if (!acronym) {
                throw new Error("acronym is required");
            }
            const res = await fetch(`${VITE_GATEWAY_API_URL}/degree/acronym/${acronym}`);
            if (!res.ok) { if (!res.ok) throw new Error(`Error ${res.status}`) }
            const body = await res.json();
            return body.data
        },
        // Usar el staleTime por defecto (0) definido en queryClient
    });
}