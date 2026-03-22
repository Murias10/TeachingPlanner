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

import { columns as defaultColumns } from "@/components/solicitud/SolicitudTable.config"
import { useTranslation } from "react-i18next"
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

interface EventRequest {
    id: string;
    professorId: string;
    calendarId: string;
    eventType: 'PUNTUAL' | 'PERIODIC';
    requestType?: 'CREATE' | 'EDIT' | 'CANCEL' | 'REPLACE';
    eventData: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
    createdAt: string;
    degreeAcronym?: string | null;
    degreeName?: string | null;
    courseStartYear?: number | null;
    courseEndYear?: number | null;
    semester?: number | null;
}

interface SolicitudTableProps {
    solicitudes: EventRequest[];
    onApprove: (solicitud: EventRequest) => void;
    onReject: (solicitud: EventRequest) => void;
    onReview: (solicitud: EventRequest) => void;
}

export function SolicitudTable({ solicitudes, onApprove, onReject, onReview }: SolicitudTableProps) {
    const { t } = useTranslation()
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [filterValue, setFilterValue] = React.useState("")

    const table = useReactTable({
        data: solicitudes,
        columns: defaultColumns({ onApprove, onReject, onReview, t }),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    })

    return (
        <div className="w-full h-full flex flex-col justify-center">
            <div className="flex items-center py-4 gap-4">
                <Input
                    placeholder={t("table.solicitudes.filter.placeholder")}
                    value={filterValue}
                    onChange={(e) => {
                        setFilterValue(e.target.value)
                        table.getColumn("professorId")?.setFilterValue(e.target.value)
                    }}
                    className="max-w-sm"
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            {t("table.solicitudes.columns.title")} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                >
                                    {column.columnDef?.meta?.label || column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table className="flex-1">
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-b hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-12">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row, idx) => (
                            <TableRow
                                key={row.id}
                                className={`h-[53px] ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/30 hover:bg-muted/40'}`}
                            >
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
                                    {t("table.solicitudes.no.results")}
                                </TableCell>
                            </TableRow>
                        )}
                        {Array.from({ length: Math.max(0, 10 - Math.max(1, table.getRowModel().rows.length)) }).map((_, idx) => (
                            <TableRow key={`empty-${idx}`} className={`h-[53px] ${((table.getRowModel().rows.length + idx) % 2 === 0) ? 'bg-background' : 'bg-muted/30'}`}>
                                <TableCell colSpan={table.getAllColumns().length}>&nbsp;</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Total: {table.getFilteredRowModel().rows.length} solicitudes
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
