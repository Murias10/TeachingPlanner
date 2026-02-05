import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Course } from "@/types/Course"
import { ProtectedComponent } from "@/components/ProtectedComponent"
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
import { MoreHorizontal, Trash2, ChevronsRight, Plus, Users, BookOpen, FileText } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
    course: Course
    deleteCourse: (courseId: string) => void;
    deleteCalendar: (calendarId: string, force: boolean) => void
    createCalendar: (courseId: string, semester: number) => void;
    onEditCourse?: (course: Course) => void;
}

export function CourseTableButtons({ course, deleteCourse, deleteCalendar, createCalendar, onEditCourse }: Props) {

    const { t } = useTranslation()

    const navigate = useNavigate()

    const goToCalendar = (semester: number) => {
        navigate(`${course.startYear}/${course.endYear}/semester/${semester}/calendar`)
    }

    const goToManageGroups = (semester: number) => {
        navigate(`${course.startYear}/${course.endYear}/semester/${semester}/groups`)
    }

    const goToManageSubjects = (semester: number) => {
        navigate(`${course.startYear}/${course.endYear}/semester/${semester}/subjects`)
    }

    const goToManageRequests = (semester: number) => {
        navigate(`${course.startYear}/${course.endYear}/semester/${semester}/solicitudes`)
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
                            <Button variant="outline" size="lg" onClick={() => goToCalendar(1)}>
                                {t("table.courses.actions.show.semester.1")}<ChevronsRight />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p> {t("table.courses.actions.show.semester.1")}</p>
                        </TooltipContent>
                    </Tooltip>
                    <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    onClick={() => goToManageSubjects(1)}
                                >
                                    <BookOpen />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar asignaturas</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    onClick={() => goToManageGroups(1)}
                                >
                                    <Users />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar grupos</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    onClick={() => goToManageRequests(1)}
                                >
                                    <FileText />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar solicitudes</p>
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
                    </ProtectedComponent>
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
                    <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    disabled
                                >
                                    <BookOpen />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar asignaturas (requiere calendario)</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    disabled
                                >
                                    <Users />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar grupos (requiere calendario)</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    disabled
                                >
                                    <FileText />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar solicitudes (requiere calendario)</p>
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
                    </ProtectedComponent>
                </>
            )}

            {hasCalendarForSemester(2) ? (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="lg" onClick={() => goToCalendar(2)}>
                                {t("table.courses.actions.show.semester.2")}<ChevronsRight />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p> {t("table.courses.actions.show.semester.2")}</p>
                        </TooltipContent>
                    </Tooltip>
                    <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    onClick={() => goToManageSubjects(2)}
                                >
                                    <BookOpen />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar asignaturas</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    onClick={() => goToManageGroups(2)}
                                >
                                    <Users />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar grupos</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    onClick={() => goToManageRequests(2)}
                                >
                                    <FileText />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar solicitudes</p>
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
                    </ProtectedComponent>
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
                    <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    disabled
                                >
                                    <BookOpen />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar asignaturas (requiere calendario)</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    disabled
                                >
                                    <Users />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar grupos (requiere calendario)</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10"
                                    disabled
                                >
                                    <FileText />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gestionar solicitudes (requiere calendario)</p>
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
                    </ProtectedComponent>
                </>
            )}

            <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
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
                        <DropdownMenuItem onClick={() => onEditCourse?.(course)}>{t("table.courses.actions.edit")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteCourse(course.id)}>{t("table.courses.actions.delete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </ProtectedComponent>
        </div>
    )
}