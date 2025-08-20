// src/components/SubjectSemesterButtons.tsx
import { Button } from "@/components/ui/button"
import { useCourseContext } from "@/context/useCourseContext"
import { useNavigate } from "react-router-dom"
import { Course } from "@/types/Course"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from "lucide-react"

type Props = {
    course: Course
}

export function CourseTableButtons({ course }: Props) {
    const { setCourseId, setSemester } = useCourseContext()
    const navigate = useNavigate()

    const goToGroups = (semester: number) => {
        console.log(`Navigating to groups for course ${course.id} in semester ${semester}`)
        setCourseId(course.id)
        setSemester(semester)
        navigate(`${course.startYear}/${course.endYear}/semester/${semester}/groups`)
    }

    return (
        <div className="flex justify-end space-x-2">
            {course.calendars?.some(c => c.semester === 1) ? (
                <Button variant="outline" size="sm" onClick={() => goToGroups(1)}>
                    Semester 1
                </Button>
            ) : (
                <Button variant="outline" size="sm" disabled>
                    Semester 1
                </Button>
            )}

            {course.calendars?.some(c => c.semester === 2) ? (
                <Button variant="outline" size="sm" onClick={() => goToGroups(2)}>
                    Semester 2
                </Button>
            ) : (
                <Button variant="outline" size="sm" disabled>
                    Semester 2
                </Button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(course.id)}>Copy ID</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View details</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
