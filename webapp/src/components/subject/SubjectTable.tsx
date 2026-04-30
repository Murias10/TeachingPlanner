import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { columns as defaultColumns } from "@/components/subject/SubjectTable.config"
import { DataTable } from "@/components/ui/DataTable"
import { Subject } from "@/types/Subject"

interface SubjectTableProps {
    subjects: Subject[];
    deleteSubject: (subjectId: string) => void;
    setSelectedIds: (ids: string[]) => void;
    isAdmin: boolean;
    onEditSubject?: (subject: Subject) => void;
}

export function SubjectTable({ subjects, deleteSubject, setSelectedIds, isAdmin, onEditSubject }: SubjectTableProps) {
    const { t } = useTranslation()
    const columns = useMemo(
        () => defaultColumns({ deleteSubject, isAdmin, onEditSubject }, t),
        [deleteSubject, isAdmin, onEditSubject, t]
    )
    return (
        <DataTable
            data={subjects}
            columns={columns}
            filterColumn="name"
            filterPlaceholder={t("table.subjects.filter.placeholder")}
            noResultsText={t("table.subjects.no.results")}
            totalLabel={t("table.subjects.title").toLowerCase()}
            columnsButtonLabel={t("table.subjects.columns.title")}
            setSelectedIds={setSelectedIds}
        />
    )
}
