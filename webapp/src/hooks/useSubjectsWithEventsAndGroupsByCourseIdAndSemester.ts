import { useQuery } from "@tanstack/react-query"
import { Subject } from "@/types/Subject"
import { useAppContext } from "@/context/useAppContext"

export function useSubjectsWithEventsAndGroupsByCourseAndSemester() {

    const { courseId, semester } = useAppContext();

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
