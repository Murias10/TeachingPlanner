import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import { Course } from "@/types/Course"
import { CourseTableButtons } from "@/components/CourseTableButtons"


export const columns: ColumnDef<Course>[] = [
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

            const course = row.original

            return (
                <CourseTableButtons course={course} />
            )
        },
    },
]

