import { useQuery } from "@tanstack/react-query"
import { Subject } from "@/types/Subject"

export function useSubjectsWithEventsAndGroupsByCourseAndSemester(courseId: string | null, semester: number | null) {
    return useQuery<Subject[], Error>({
        queryKey: ["subjects", courseId, semester],
        queryFn: async () => {
            if (!courseId || !semester) {
                throw new Error("CourseId and semester are required");
            }

            const res = await fetch(`http://localhost:8080/subjects/with-events/groups/by-course/${courseId}/semester/${semester}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.subjects
        },
        enabled: !!courseId && !!semester, // Solo ejecuta la query si ambos parámetros están disponibles
        staleTime: 5 * 60_000,
    })
}