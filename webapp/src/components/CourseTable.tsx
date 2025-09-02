import * as React from "react"
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    SortingState,
    ColumnFiltersState,
    VisibilityState
} from "@tanstack/react-table"

import { columns as defaultColumns } from "@/components/CourseTable.config"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableHeader,
    TableHead,
    TableBody,
    TableRow,
    TableCell
} from "@/components/ui/table"
import { Course } from "@/types/Course"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"

interface CourseTableProps {
    courses: Course[];
    deleteCourse: (courseId: string) => void,
    deleteCalendar: (calendarId: string, force: boolean) => void
    setSelectedIds: (ids: string[]) => void;
}

export function CourseTable({ courses, deleteCourse, deleteCalendar, setSelectedIds }: CourseTableProps) {

    const { t } = useTranslation();

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [filterValue, setFilterValue] = React.useState("")

    useEffect(() => {
        const ids = Object.keys(rowSelection).map(idx => courses[Number(idx)]?.id).filter(Boolean)
        setSelectedIds(ids)
    }, [rowSelection, courses, setSelectedIds])

    const table = useReactTable({
        data: courses,
        columns: defaultColumns({ deleteCourse, deleteCalendar }, t),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } }
    })

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter state..."
                    value={filterValue}
                    onChange={e => {
                        setFilterValue(e.target.value)
                        table.getColumn("state")?.setFilterValue(e.target.value)
                    }}
                    className="max-w-sm"
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table.getAllColumns()
                            .filter(c => c.getCanHide())
                            .map(c => (
                                <DropdownMenuCheckboxItem
                                    key={c.id}
                                    checked={c.getIsVisible()}
                                    onCheckedChange={v => c.toggleVisibility(!!v)}
                                >
                                    {c.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={defaultColumns.length}
                                    className="h-24 text-center"
                                >
                                    No results for this degree.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
