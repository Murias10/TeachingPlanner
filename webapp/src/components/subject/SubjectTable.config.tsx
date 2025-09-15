// components/SubjectTable.config.ts
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowUpDown, Trash2, Pencil, Eye } from "lucide-react"
import { TFunction } from "i18next"
import { Subject } from "@/types/Subject"

interface ColumnExtraProps {
    deleteSubject: (subjectId: string) => void;
}

export const columns = ({ deleteSubject }: ColumnExtraProps, t: TFunction): ColumnDef<Subject>[] => [
    {
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
    },
    {
        accessorKey: "acronym",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                {t("table.subjects.columns.acronym")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                {t("table.subjects.columns.name")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "semester",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                {t("table.subjects.columns.semester")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => {
            const semester = getValue<number>();
            const label = semester === 1 ? t("table.subjects.semester.1") : semester === 2 ? t("table.subjects.semester.2") : "—";
            return <span>{label}</span>;
        }
    },
    {
        accessorKey: "year",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                {t("table.subjects.columns.year")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => {
            const year = getValue<number>();
            const label =
                year === 1 ? t("table.subjects.year.1") :
                    year === 2 ? t("table.subjects.year.2") :
                        year === 3 ? t("table.subjects.year.3") :
                            year === 4 ? t("table.subjects.year.4") :
                                "—";
            return <span>{label}</span>;
        },
    },
    {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => {
            const subject = row.original

            return (
                <div className="flex justify-end space-x-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10">
                                <Eye />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.subjects.actions.view")}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-10">
                                <Pencil />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.subjects.actions.edit")}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive" size="icon" className="size-10" onClick={() => deleteSubject(subject.id)}>
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("table.subjects.actions.delete")}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )
        },
    },
]
