import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Subject } from "@/types/Subject"
import { Checkbox } from "@/components/ui/checkbox"
import { GroupTableButtons } from "@/components/GroupTableButtons"

export const columns: ColumnDef<Subject>[] = [
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
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                Name <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "year",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                Year <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<number>()}</span>,
    },
    {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => {
            const subject = row.original
            return (
                <GroupTableButtons subject={subject} />
            )
        },
    }
]
