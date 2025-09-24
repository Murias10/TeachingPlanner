import { Button } from "@/components/ui/button"
import { useAppContext } from "@/context/useAppContext"
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
import { useTranslation } from "react-i18next"

type Props = {
    course: Course
    deleteCourse: (courseId: string) => void;
    deleteCalendar: (calendarId: string, force: boolean) => void
    createCalendar: (courseId: string, semester: number) => void;
}

export function CourseTableButtons({ course, deleteCourse, deleteCalendar, createCalendar }: Props) {

    const { t } = useTranslation()

    const { setCourseId, setSemester } = useAppContext()
    const navigate = useNavigate()

    const goToGroups = (semester: number) => {
        setCourseId(course.id)
        setSemester(semester)
        navigate(`${course.startYear}/${course.endYear}/semester/${semester}/groups`)
    }

    // Funciones auxiliares para encontrar calendarios por semestre
    const findCalendarBySemester = (semester: number) => {
        return course.calendars?.find(calendar => calendar.semester === semester);
    }

    const hasCalendarForSemester = (semester: number) => {
        return course.calendars?.some(calendar => calendar.semester === semester) || false;
    }

    // Obtener calendarios específicos
    const semester1Calendar = findCalendarBySemester(1);
    const semester2Calendar = findCalendarBySemester(2);

    return (
        <div className="flex justify-end space-x-2">
            {hasCalendarForSemester(1) ? (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" onClick={() => goToGroups(1)}>
                                {t("table.courses.actions.show.semester.1")}<ChevronsRight />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p> {t("table.courses.actions.show.semester.1")}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="size-10"
                                onClick={() => semester1Calendar && deleteCalendar(semester1Calendar.id, false)}
                            >
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.courses.actions.delete.semester.1")}</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            ) : (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" disabled>
                                {t("table.courses.actions.show.semester.1")}<ChevronsRight />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.courses.actions.show.semester.1")}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10" onClick={() => createCalendar(course.id, 1)}>
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.courses.actions.create.semester.1")}</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            )}

            {hasCalendarForSemester(2) ? (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" onClick={() => goToGroups(2)}>
                                {t("table.courses.actions.show.semester.2")}<ChevronsRight />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p> {t("table.courses.actions.show.semester.2")}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="size-10"
                                onClick={() => semester2Calendar && deleteCalendar(semester2Calendar.id, false)}
                            >
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.courses.actions.delete.semester.2")}</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            ) : (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" disabled>
                                {t("table.courses.actions.show.semester.2")}<ChevronsRight />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.courses.actions.show.semester.2")}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10" onClick={() => createCalendar(course.id, 2)}>
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.courses.actions.create.semester.2")}</p>
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
                    <DropdownMenuLabel>{t("table.courses.actions.title")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => console.log("View")}>{t("table.courses.actions.view")}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log("Edit")}>{t("table.courses.actions.edit")}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteCourse(course.id)}>{t("table.courses.actions.delete")}</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}