"use client"

import * as React from "react"
import {
    useReactTable,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { data, CourseRecord } from "./CourseTable.config"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableHeader,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table"

export function CourseTable() {
    // estados de la tabla
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [filterValue, setFilterValue] = React.useState("")

    // callback cuando el usuario pulsa un semestre
    const handleSemesterClick = React.useCallback(
        (record: CourseRecord, sem: 1 | 2) => {
            console.log(`Clicked ${record.startYear}-${record.endYear}, semester ${sem}`)
            // aquí tu lógica (p.ej. navegar, abrir modal, etc.)
        },
        []
    )

    // definimos las columnas, incluyendo los botones de semestre en "Actions"
    const columns = React.useMemo<ColumnDef<CourseRecord>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(!!v)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: "course",
                accessorFn: (row) => `${row.startYear}-${row.endYear}`,
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="flex items-center gap-1"
                    >
                        Course <ArrowUpDown className="h-4 w-4" />
                    </Button>
                ),
                cell: ({ getValue }) => <span>{getValue<string>()}</span>,
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
                enableSorting: false,
                cell: ({ row }) => {
                    const record = row.original
                    return (
                        <div className="flex justify-end space-x-5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSemesterClick(record, 1)}
                            >
                                Semester 1
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSemesterClick(record, 2)}
                            >
                                Semester 2
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(record.id)}>
                                        Copy record ID
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>View details</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )
                },
            },
        ],
        [handleSemesterClick]
    )

    const table = useReactTable<CourseRecord>({
        data,
        columns,
        state: { sorting, columnFilters, columnVisibility, rowSelection },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 5 } },
    })

    return (
        <div className="w-full">
            {/* filtro y selector de columnas */}
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter state..."
                    value={filterValue}
                    onChange={(e) => {
                        setFilterValue(e.target.value)
                        table.getColumn("state")?.setFilterValue(e.target.value)
                    }}
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((col) => col.getCanHide())
                            .map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col.id}
                                    className="capitalize"
                                    checked={col.getIsVisible()}
                                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                                >
                                    {col.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* tabla */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* paginación */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
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
        </div>
    )
}
