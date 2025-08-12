import { useQuery } from "@tanstack/react-query"
import { Subject } from "@/types/Subject"

export function useSubjectsWithEventsAndGroupsByCourseAndSemester(courseId: string, semester: number) {
    return useQuery<Subject[], Error>({
        queryKey: ["subjects"],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8080/subjects/with-events/groups/by-course/${courseId}/semester/${semester}`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.subjects
        },
        staleTime: 5 * 60_000,
    })
}
