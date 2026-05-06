import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { columns as defaultColumns } from "@/components/course/CourseTable.config"
import { DataTable } from "@/components/ui/DataTable"
import { Course } from "@/types/Course"

interface CourseTableProps {
    courses: Course[];
    deleteCourse: (courseId: string) => void;
    deleteCalendar: (calendarId: string, force: boolean) => void;
    createCalendar: (courseId: string, semester: number) => void;
    onEditCourse?: (course: Course) => void;
    setSelectedIds: (ids: string[]) => void;
    isAdmin: boolean;
}

export function CourseTable({ courses, deleteCourse, deleteCalendar, createCalendar, onEditCourse, setSelectedIds, isAdmin }: CourseTableProps) {
    const { t } = useTranslation()
    const columns = useMemo(
        () => defaultColumns({ deleteCourse, deleteCalendar, createCalendar, onEditCourse, isAdmin }, t),
        [deleteCourse, deleteCalendar, createCalendar, onEditCourse, isAdmin, t]
    )
    return (
        <DataTable
            data={courses}
            columns={columns}
            filterColumn="course"
            filterPlaceholder={t("table.courses.filter.placeholder")}
            noResultsText={t("table.courses.no.results")}
            totalLabel={t("table.courses.title").toLowerCase()}
            columnsButtonLabel={t("table.courses.columns.title")}
            setSelectedIds={setSelectedIds}
        />
    )
}
