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
    VisibilityState,
} from "@tanstack/react-table"

import { columns as defaultColumns } from "@/components/subject/SubjectTable.config"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
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
import { Subject } from "@/types/Subject"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

interface SubjectTableProps {
    subjects: Subject[];
    deleteSubject: (subjectId: string) => void;
    setSelectedIds: (ids: string[]) => void;
    isAdmin: boolean;
    onEditSubject?: (subject: Subject) => void;
}

export function SubjectTable({ subjects, deleteSubject, setSelectedIds, isAdmin, onEditSubject }: SubjectTableProps) {

    const { t } = useTranslation();

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [filterValue, setFilterValue] = React.useState("")

    useEffect(() => {
        const ids = Object.keys(rowSelection).map(idx => subjects[Number(idx)]?.id).filter(Boolean)
        setSelectedIds(ids)
    }, [rowSelection, subjects])

    const table = useReactTable({
        data: subjects,
        columns: defaultColumns({ deleteSubject, isAdmin, onEditSubject }, t),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    })

    return (
        <div className="w-full h-full flex flex-col justify-center">
            <div className="flex items-center py-4">
                <Input
                    placeholder={t("table.subjects.filter.placeholder")}
                    value={filterValue}
                    onChange={(e) => {
                        setFilterValue(e.target.value)
                        table.getColumn("name")?.setFilterValue(e.target.value)
                    }}
                    className="max-w-sm"
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            {t("table.subjects.columns.title")} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table.getAllColumns()
                            .filter((c) => c.getCanHide())
                            .map((c) => (
                                <DropdownMenuCheckboxItem
                                    key={c.id}
                                    checked={c.getIsVisible()}
                                    onCheckedChange={(v) => c.toggleVisibility(!!v)}
                                >
                                    {c.columnDef?.meta?.label || c.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
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
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className="h-[53px]">
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <TableRow className="h-[53px]">
                                <TableCell colSpan={table.getAllColumns().length} className="text-center">
                                    {t("table.subjects.no.results")}
                                </TableCell>
                            </TableRow>
                        )}
                        {Array.from({ length: Math.max(0, 10 - Math.max(1, table.getRowModel().rows.length)) }).map((_, idx) => (
                            <TableRow key={`empty-${idx}`} className="h-[53px]">
                                <TableCell colSpan={table.getAllColumns().length}>&nbsp;</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Total: {table.getFilteredRowModel().rows.length} {t("table.subjects.title").toLowerCase()}
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {t("table.pagination.previous")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {t("table.pagination.next")}
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}