
import { Button } from "@/components/ui/button"
import { useCourseContext } from "@/context/useCourseContext"
import { useNavigate } from "react-router-dom"
import { Course } from "@/types/Course"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, ChevronsRight, Plus } from "lucide-react"

type Props = {
    course: Course
    deleteCourse: (courseId: string) => void;
    deleteCalendar: (calendarId: string, force: boolean) => void
}

export function CourseTableButtons({ course, deleteCourse, deleteCalendar }: Props) {

    const { setCourseId, setSemester } = useCourseContext()
    const navigate = useNavigate()

    const goToGroups = (semester: number) => {
        setCourseId(course.id)
        setSemester(semester)
        navigate(`${course.startYear}/${course.endYear}/semester/${semester}/groups`)
    }

    return (
        <div className="flex justify-end space-x-2">
            {course.calendars?.some(c => c.semester === 1) ? (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" onClick={() => goToGroups(1)}>
                                <ChevronsRight /> Semestre 1
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>dwadwa</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive" size="icon" className="size-10" onClick={() => deleteCalendar(course.calendars?.[0].id, false)}>
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>dwadwa</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            ) : (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" disabled>
                                <ChevronsRight /> Semestre 1
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>dwadwa</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10">
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>dwadwa</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            )}

            {course.calendars?.some(c => c.semester === 2) ? (
                <>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" onClick={() => goToGroups(2)}>
                                <ChevronsRight /> Semestre 2
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>HOLA MUNDO</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive" size="icon" className="size-10" onClick={() => deleteCalendar(course.calendars?.[1].id, false)}>
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>HOLA MUNDO</p>
                        </TooltipContent>
                    </Tooltip>
                </>

            ) : (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" disabled>
                                <ChevronsRight /> Semestre 2
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>HOLA MUNDO</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10">
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>dwadwa</p>
                        </TooltipContent>
                    </Tooltip>
                </>
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
                    <DropdownMenuItem onClick={() => deleteCourse(course.id)}>Eliminar curso</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
