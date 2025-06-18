import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"


export interface CourseRecord {
    id: string
    idDegree: string
    startYear: number
    endYear: number
    state: "success" | "processing" | "failed"
    email: string
}

export const data: CourseRecord[] = [
    {
        id: "1",
        idDegree: "1",
        startYear: 2023,
        endYear: 2024,
        state: "success",
        email: "murias101010@gmail.com"
    },
    {
        id: "2",
        idDegree: "1",
        startYear: 2024,
        endYear: 2025,
        state: "processing",
        email: "uo290009@uniovi.es"
    },
    {
        id: "3",
        idDegree: "1",
        startYear: 2022,
        endYear: 2023,
        state: "failed",
        email: "email@gmail.com"
    },
    {
        id: "4",
        idDegree: "1",
        startYear: 2024,
        endYear: 2025,
        state: "processing",
        email: "uo290009@uniovi.es"
    },
    {
        id: "5",
        idDegree: "1",
        startYear: 2022,
        endYear: 2023,
        state: "failed",
        email: "email@gmail.com"
    },
    {
        id: "6",
        idDegree: "1",
        startYear: 2024,
        endYear: 2025,
        state: "processing",
        email: "uo290009@uniovi.es"
    },
    {
        id: "7",
        idDegree: "1",
        startYear: 2022,
        endYear: 2023,
        state: "failed",
        email: "email@gmail.com"
    },
]

export const columns: ColumnDef<CourseRecord>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "course",
        accessorFn: (row) => row.startYear, // Use startYear for sorting
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Course
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => {
            const startYear = row.original.startYear;
            const endYear = row.original.endYear;
            return <div>{startYear}-{endYear}</div>;
        },
    },
    {
        accessorKey: "state",
        header: "State",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("state")}</div>
        ),
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const payment = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(payment.id)}
                        >
                            Copy payment ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View customer</DropdownMenuItem>
                        <DropdownMenuItem>View payment details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
