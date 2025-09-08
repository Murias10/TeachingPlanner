import { useQuery } from "@tanstack/react-query"
import { Course } from "@/types/Course"
import { useAppContext } from "@/context/useAppContext";

export function useCourses() {

    const { degreeId } = useAppContext();

    return useQuery<Course[], Error>({
        queryKey: ["courses", degreeId],
        enabled: degreeId !== null, // solo se activa si hay degree seleccionado
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/courses/degree/${degreeId}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.courses
        },
        staleTime: 5 * 60_000, // 5 minutos
    })
}
