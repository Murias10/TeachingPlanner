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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowUpDown, MoreHorizontal, Trash2, Pencil, ExternalLink, Eye } from "lucide-react"
import { Classroom } from "@/types/Classroom"
import { Link } from "react-router-dom"


export const columns: ColumnDef<Classroom>[] = [
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
        accessorKey: "code",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                Code <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "gisUrl",
        header: "GIS URL",
        cell: ({ getValue }) => (
            // <a
            //     href={getValue<string>()}
            //     target="_blank"
            //     rel="noopener noreferrer"
            //     className="text-blue-500 underline"
            // >
            //     Link
            // </a>
            <span>{getValue<string>()}</span>
        ),
    },
    {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => {
            const classroom = row.original
            return (
                <div className="flex justify-end space-x-2">
                    <Link to={classroom.gisUrl} target="_blank" rel="noopener noreferrer">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="size-8">
                                    <ExternalLink />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Go to {classroom.gisUrl}</p>
                            </TooltipContent>
                        </Tooltip>
                    </Link>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-8">
                                <Eye />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Show details</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="size-8">
                                <Pencil />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Edit classroom</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="destructive" size="icon" className="size-8">
                                <Trash2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete classroom</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* <Button variant="outline" size="sm">
                        <Pencil /> Edit
                    </Button>
                    
                    <Button variant="destructive" size="sm">
                        <Trash2 /> Delete
                    </Button> */}

                    {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(classroom.id)}>Copy ID</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Delete classroom</DropdownMenuItem>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu> */}
                </div>
            )
        },
    },
]
