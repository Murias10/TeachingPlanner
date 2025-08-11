import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Course } from "@/types/Course"
import { Link } from 'react-router-dom'


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
                <div className="flex justify-end space-x-2">

                    {course.calendars?.some(calendar => calendar.semester === 1) ? (
                        <Link to={`/courses/degree/${course.id}/${course.startYear}/${course.endYear}/semester/1/groups`}>
                            <Button variant="outline" size="sm">Semester 1</Button>
                        </Link>
                    ) : (
                        <Button variant="outline" size="sm" disabled>Semester 1</Button>
                    )}

                    {course.calendars?.some(c => c.semester === 2) ? (
                        <Link to={`/courses/degree/${course.id}/${course.startYear}/${course.endYear}/semester/2/groups`}>
                            <Button variant="outline" size="sm">Semester 2</Button>
                        </Link>
                    ) : (
                        <Button variant="outline" size="sm" disabled>Semester 2</Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(course.id)}>Copy ID</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View details</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]

