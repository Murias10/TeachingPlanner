import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'

export interface CourseRecord {
    id: string
    idDegree: string
    startYear: number
    endYear: number
    state: "success" | "processing" | "failed"
    email: string
}

export const data: CourseRecord[] = [
    { id: "1", idDegree: "1", startYear: 2023, endYear: 2024, state: "success", email: "murias101010@gmail.com" },
    { id: "2", idDegree: "1", startYear: 2024, endYear: 2025, state: "processing", email: "uo290009@uniovi.es" },
    { id: "3", idDegree: "1", startYear: 2022, endYear: 2023, state: "failed", email: "email@gmail.com" },
    { id: "4", idDegree: "1", startYear: 2024, endYear: 2025, state: "processing", email: "uo290009@uniovi.es" },
    { id: "5", idDegree: "1", startYear: 2022, endYear: 2023, state: "failed", email: "email@gmail.com" },
    { id: "6", idDegree: "1", startYear: 2024, endYear: 2025, state: "processing", email: "uo290009@uniovi.es" },
    { id: "7", idDegree: "1", startYear: 2022, endYear: 2023, state: "failed", email: "email@gmail.com" },
]

export const columns: ColumnDef<CourseRecord>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={v => row.toggleSelected(!!v)}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'course',
        accessorFn: row => `${row.startYear}-${row.endYear}`,
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1">
                Course <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: 'state',
        header: 'State',
        cell: ({ row }) => <div className="capitalize">{row.getValue('state')}</div>,
    },
    {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => {
            const record = row.original
            return (
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => console.log('Sem 1')}>Semester 1</Button>
                    <Button variant="outline" size="sm" onClick={() => console.log('Sem 2')}>Semester 2</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(record.id)}>Copy ID</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View details</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]