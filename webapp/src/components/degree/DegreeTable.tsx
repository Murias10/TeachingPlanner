import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { columns as defaultColumns } from "@/components/degree/DegreeTable.config"
import { DataTable } from "@/components/ui/DataTable"
import { Degree } from "@/types/Degree"

interface DegreeTableProps {
    degrees: Degree[];
    deleteDegree: (degreeId: string) => void;
    editDegree?: (degree: Degree) => void;
    setSelectedIds: (ids: string[]) => void;
    isAdmin?: boolean;
}

export function DegreeTable({ degrees, deleteDegree, editDegree, setSelectedIds, isAdmin = false }: DegreeTableProps) {
    const { t } = useTranslation()
    const columns = useMemo(
        () => defaultColumns({ deleteDegree, editDegree, isAdmin }, t),
        [deleteDegree, editDegree, isAdmin, t]
    )
    return (
        <DataTable
            data={degrees}
            columns={columns}
            filterColumn="name"
            filterPlaceholder={t("table.degrees.filter.placeholder")}
            noResultsText={t("table.degrees.no.results")}
            totalLabel={t("table.degrees.title").toLowerCase()}
            columnsButtonLabel={t("table.degrees.columns.title")}
            setSelectedIds={setSelectedIds}
        />
    )
}
