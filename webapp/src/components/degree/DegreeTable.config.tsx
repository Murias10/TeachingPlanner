import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { DegreeTableButtons } from "@/components/degree/DegreeTableButtons"
import { Degree } from "@/types/Degree"
import { TFunction } from "i18next"

interface ColumnExtraProps {
    deleteDegree: (degreeId: string) => void;
}



export const columns = ({ deleteDegree }: ColumnExtraProps, t: TFunction): ColumnDef<Degree>[] => [
    {
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
    },
    {
        accessorKey: "name",
        enableHiding: false,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.degrees.columns.name")}<ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "acronym",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.degrees.columns.acronym")}<ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => {

            const degree = row.original

            return (
                <DegreeTableButtons degree={degree} deleteDegree={deleteDegree} />
            )
        },
    },
]
