import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { columns as defaultColumns } from "@/components/user/UserTable.config"
import { DataTable } from "@/components/ui/DataTable"
import { User } from "@/types/auth.types"

interface UserTableProps {
    users: User[];
    deleteUser: (userId: string) => void;
    editUser?: (user: User) => void;
    sendActivationEmail?: (userId: string) => void;
    setSelectedIds: (ids: string[]) => void;
    isAdmin?: boolean;
}

export function UserTable({ users, deleteUser, editUser, sendActivationEmail, setSelectedIds, isAdmin = false }: UserTableProps) {
    const { t } = useTranslation()
    const columns = useMemo(
        () => defaultColumns({ deleteUser, editUser, sendActivationEmail, isAdmin, t }),
        [deleteUser, editUser, sendActivationEmail, isAdmin, t]
    )
    return (
        <DataTable
            data={users}
            columns={columns}
            filterColumn="email"
            filterPlaceholder={t("table.users.filter.placeholder")}
            noResultsText={t("table.users.no.results")}
            totalLabel={t("table.users.title").toLowerCase()}
            columnsButtonLabel={t("table.users.columns.title")}
            setSelectedIds={setSelectedIds}
        />
    )
}
