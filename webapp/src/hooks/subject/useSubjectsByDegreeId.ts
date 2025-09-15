import { useQuery } from "@tanstack/react-query";
import { Subject } from "@/types/Subject";

export function useSubjectsByDegreeId(degreeId: string | null) {
    return useQuery<Subject[], Error>({
        queryKey: ["subjects", degreeId],
        enabled: !!degreeId, // solo se activa si hay degreeId válido
        queryFn: async () => {
            if (!degreeId) {
                throw new Error("degreeId is required");
            }

            const res = await fetch(`http://localhost:8080/subjects/degree/${degreeId}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const body = await res.json();
            return body.data.subjects;
        },
        staleTime: 5 * 60_000, // 5 minutos
    });
}