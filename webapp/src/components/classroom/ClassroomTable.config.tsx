import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ProtectedComponent } from "@/components/ProtectedComponent"
import { ArrowUpDown } from "lucide-react"
import { EditDeleteTableButtons } from "@/components/common/EditDeleteTableButtons"
import { Classroom } from "@/types/Classroom"
import { Link } from "react-router-dom"
import { TFunction } from "i18next"

interface ColumnExtraProps {
    deleteClassroom: (classroomId: string) => void;
    isAdmin?: boolean;
    onEditClassroom?: (classroom: Classroom) => void;
}

export const columns = ({ deleteClassroom, isAdmin = false, onEditClassroom }: ColumnExtraProps, t: TFunction): ColumnDef<Classroom>[] => {
    const cols: ColumnDef<Classroom>[] = [];

    // Solo agregar columna de selección si es ADMIN
    if (isAdmin) {
        cols.push({
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
        accessorKey: "code",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                {t("table.classrooms.columns.code")}
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        meta: {
            label: t("table.classrooms.columns.code")
        }
    },
        {
            accessorKey: "gisUrl",
            header: t("table.classrooms.columns.gisUrl"),
            cell: ({ getValue }) => {
                const gisUrl = getValue<string>();
                return gisUrl ? (
                    <Link to={gisUrl} target="_blank" className="text-blue-600 hover:underline">
                        {gisUrl}
                    </Link>
                ) : (
                    <span>—</span>
                );
            },
            meta: {
                label: t("table.classrooms.columns.gisUrl")
            }
        },
        {
            id: "actions",
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => {
                const classroom = row.original

                return (
                    <div className="flex justify-end items-center gap-2">
                        <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                            <EditDeleteTableButtons
                                onEdit={() => onEditClassroom?.(classroom)}
                                onDelete={() => deleteClassroom(classroom.id)}
                            />
                        </ProtectedComponent>
                    </div>
                )
            },
        });

    return cols;
}
