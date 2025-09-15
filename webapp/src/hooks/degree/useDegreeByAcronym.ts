import { useQuery } from "@tanstack/react-query";
import { Degree } from "@/types/Degree";

export function useDegreeByAcronym(acronym: string | null) {
    return useQuery<Degree, Error>({
        queryKey: ["degree", "acronym", acronym],
        enabled: !!acronym, // solo se activa si hay acronym válido
        queryFn: async () => {
            if (!acronym) {
                throw new Error("acronym is required");
            }
            const res = await fetch(`http://localhost:8080/degree/acronym/${acronym}`);
            if (!res.ok) { if (!res.ok) throw new Error(`Error ${res.status}`) }
            const body = await res.json();
            return body.data
        },
        staleTime: 5 * 60_000, // 5 minutos
    });
}