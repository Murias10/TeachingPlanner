import { useQuery } from "@tanstack/react-query";
import { useDegreeContext } from "@/context/useDegreeContext";
import { Subject } from "@/types/Subject";

export function useSubjects() {
    const { degreeId } = useDegreeContext();

    return useQuery<Subject[], Error>({
        queryKey: ["subjects", degreeId],
        enabled: degreeId !== null, // solo se activa si hay degree seleccionado
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/subjects/degree/${degreeId}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const body = await res.json();
            return body.data.subjects;
        },
        staleTime: 5 * 60_000, // 5 minutos
    });
}
