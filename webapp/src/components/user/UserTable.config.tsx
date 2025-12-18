import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, CheckCircle, XCircle } from "lucide-react"
import { UserTableButtons } from "@/components/user/UserTableButtons"
import { User } from "@/types/auth.types"
import { TFunction } from "i18next"

interface ColumnExtraProps {
    deleteUser: (userId: string) => void;
    editUser?: (user: User) => void;
    sendActivationEmail?: (userId: string) => void;
    isAdmin?: boolean;
    t: TFunction;
}

const getColorFromText = (text: string) => {
    const colors = [
        "bg-red-100 text-red-800",
        "bg-blue-100 text-blue-800",
        "bg-green-100 text-green-800",
        "bg-yellow-100 text-yellow-800",
        "bg-purple-100 text-purple-800",
        "bg-pink-100 text-pink-800",
        "bg-indigo-100 text-indigo-800",
        "bg-orange-100 text-orange-800",
        "bg-cyan-100 text-cyan-800",
        "bg-emerald-100 text-emerald-800"
    ];

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return colors[Math.abs(hash) % colors.length];
};

export const columns = ({ deleteUser, editUser, sendActivationEmail, isAdmin = false, t }: ColumnExtraProps): ColumnDef<User>[] => {
    const cols: ColumnDef<User>[] = [];

    if (isAdmin) {
        cols.push({
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        });
    }

    cols.push({
        accessorKey: "unioviUser",
        header: t("table.users.columns.unioviUser"),
        cell: ({ row }) => row.original.unioviUser || '-',
        meta: {
            label: t("table.users.columns.unioviUser")
        }
    });

    cols.push({
        accessorKey: "email",
        enableHiding: false,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.users.columns.email")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => row.original.email,
        meta: {
            label: t("table.users.columns.email")
        }
    });

    cols.push({
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.users.columns.name")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => row.original.name,
        meta: {
            label: t("table.users.columns.name")
        }
    });

    cols.push({
        accessorKey: "firstSurname",
        header: t("table.users.columns.firstSurname"),
        cell: ({ row }) => row.original.firstSurname,
        meta: {
            label: t("table.users.columns.firstSurname")
        }
    });

    cols.push({
        accessorKey: "secondSurname",
        header: t("table.users.columns.secondSurname"),
        cell: ({ row }) => row.original.secondSurname,
        meta: {
            label: t("table.users.columns.secondSurname")
        }
    });

    cols.push({
        accessorKey: "isActive",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.users.columns.isActive")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const isActive = row.original.isActive;
            return (
                <Badge
                    className={isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    }
                >
                    <div className="flex items-center gap-1">
                        {isActive ? (
                            <>
                                <CheckCircle className="h-3 w-3" />
                                Activo
                            </>
                        ) : (
                            <>
                                <XCircle className="h-3 w-3" />
                                Inactivo
                            </>
                        )}
                    </div>
                </Badge>
            );
        },
        meta: {
            label: t("table.users.columns.isActive")
        }
    });

    cols.push({
        accessorKey: "role",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.users.columns.role")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge className={getColorFromText(row.original.role)}>
                {row.original.role}
            </Badge>
        ),
        meta: {
            label: t("table.users.columns.role")
        }
    });

    if (isAdmin) {
        cols.push({
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => (
                <div className="flex justify-end items-center gap-2">
                    <UserTableButtons
                        onDelete={() => deleteUser(row.original.id)}
                        onEdit={() => editUser?.(row.original)}
                        onSendActivation={!row.original.isActive ? () => sendActivationEmail?.(row.original.id) : undefined}
                    />
                </div>
            ),
            meta: {
                label: t("table.users.columns.actions")
            }
        });
    }

    return cols;
};
