// components/SubjectTable.config.ts
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

export interface Subject {
    id: string
    acronym: string
    semester: number
    year: number
    name: string
    siesCode: string
}

export const data: Subject[] = [
    {
        id: "1",
        acronym: "ISW",
        semester: 1,
        year: 2024,
        name: "Ingeniería del Software",
        siesCode: "123456789"
    },
    {
        id: "2",
        acronym: "BD",
        semester: 2,
        year: 2024,
        name: "Bases de Datos",
        siesCode: "987654321"
    },
]

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
        accessorKey: "acronym",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                Acronym <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "semester",
        header: "Semester",
        cell: ({ getValue }) => <span>{getValue<number>()}</span>,
    },
    {
        accessorKey: "year",
        header: "Year",
        cell: ({ getValue }) => <span>{getValue<number>()}</span>,
    },
    {
        accessorKey: "siesCode",
        header: "SIES Code",
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => {
            const subject = row.original
            return (
                <div className="flex justify-end space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(subject.id)}>Copy ID</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View details</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
