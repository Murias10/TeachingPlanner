import { useQuery } from "@tanstack/react-query";
import { Subject } from "@/types/Subject";
import VITE_GATEWAY_API_URL from "@/config/api";

export function useSubjectsByDegreeId(degreeId: string | null) {
    return useQuery<Subject[], Error>({
        queryKey: ["subjects", degreeId],
        enabled: !!degreeId, // solo se activa si hay degreeId válido
        queryFn: async () => {
            if (!degreeId) {
                throw new Error("degreeId is required");
            }

            const res = await fetch(`${VITE_GATEWAY_API_URL}/subjects/degree/${degreeId}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const body = await res.json();
            return body.data.subjects;
        },
        // Usar el staleTime por defecto (0) definido en queryClient
    });
}