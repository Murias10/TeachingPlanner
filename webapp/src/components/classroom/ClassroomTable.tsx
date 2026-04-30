import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { columns as defaultColumns } from "@/components/classroom/ClassroomTable.config"
import { DataTable } from "@/components/ui/DataTable"
import { Classroom } from "@/types/Classroom"

interface ClassroomTableProps {
    classrooms: Classroom[];
    deleteClassroom: (classroomId: string) => void;
    setSelectedIds: (ids: string[]) => void;
    isAdmin: boolean;
    onEditClassroom?: (classroom: Classroom) => void;
}

export function ClassroomTable({ classrooms, deleteClassroom, setSelectedIds, isAdmin, onEditClassroom }: ClassroomTableProps) {
    const { t } = useTranslation()
    const columns = useMemo(
        () => defaultColumns({ deleteClassroom, isAdmin, onEditClassroom }, t),
        [deleteClassroom, isAdmin, onEditClassroom, t]
    )
    return (
        <DataTable
            data={classrooms}
            columns={columns}
            filterColumn="code"
            filterPlaceholder={t("table.classrooms.filter.placeholder")}
            noResultsText={t("table.classrooms.no.results")}
            totalLabel={t("table.classrooms.title").toLowerCase()}
            columnsButtonLabel={t("table.classrooms.columns.title")}
            setSelectedIds={setSelectedIds}
        />
    )
}
