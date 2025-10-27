import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ProtectedComponent } from "@/components/ProtectedComponent"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowUpDown, Trash2, Pencil, ExternalLink, Eye } from "lucide-react"
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
            cell: ({ getValue }) => (
                <span>{getValue<string>()}</span>
            ),
        },
        {
            id: "actions",
            enableSorting: false,
            cell: ({ row }) => {
                const classroom = row.original

                return (
                    <div className="flex justify-end space-x-2">
                        <Link to={`https://${classroom.gisUrl}`} target="_blank" className="flex items-center">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="size-10">
                                        <ExternalLink />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t("table.classrooms.actions.gisUrl", { url: classroom.gisUrl })}</p>
                                </TooltipContent>
                            </Tooltip>
                        </Link>

                        <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="size-10">
                                        <Eye />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t("table.classrooms.actions.view")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </ProtectedComponent>

                        <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="size-10" onClick={() => onEditClassroom?.(classroom)}>
                                        <Pencil />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t("table.classrooms.actions.edit")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </ProtectedComponent>

                        <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" size="icon" className="size-10" onClick={() => deleteClassroom(classroom.id)}>
                                        <Trash2 />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t("table.classrooms.actions.delete")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </ProtectedComponent>


                    </div>
                )
            },
        });

    return cols;
}
