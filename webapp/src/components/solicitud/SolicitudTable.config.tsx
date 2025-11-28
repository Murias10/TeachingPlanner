import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Check, X } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import moment from "moment"

interface EventRequest {
    id: string;
    teacherId: string;
    calendarId: string;
    eventType: 'PUNTUAL' | 'PERIODIC';
    eventData: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
    createdAt: string;
}

interface ColumnExtraProps {
    onApprove: (solicitud: EventRequest) => void;
    onReject: (solicitud: EventRequest) => void;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PENDING':
            return <Badge className="bg-amber-200 text-amber-900">Pendiente</Badge>;
        case 'APPROVED':
            return <Badge className="bg-emerald-200 text-emerald-900">Aprobada</Badge>;
        case 'REJECTED':
            return <Badge className="bg-rose-200 text-rose-900">Rechazada</Badge>;
        default:
            return <Badge>Desconocido</Badge>;
    }
};

const getEventTypeLabel = (eventType: string) => {
    return eventType === 'PUNTUAL' ? 'Puntual' : 'Periódica';
};

export const columns = ({ onApprove, onReject }: ColumnExtraProps): ColumnDef<EventRequest>[] => [
    {
        accessorKey: "teacherId",
        enableHiding: false,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                Profesor
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("teacherId")}</div>,
    },
    {
        accessorKey: "eventType",
        header: () => <div>Tipo de Evento</div>,
        cell: ({ row }) => <div>{getEventTypeLabel(row.getValue("eventType"))}</div>,
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                Fecha de Solicitud
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div>{moment(row.getValue("createdAt")).format('DD/MM/YYYY HH:mm')}</div>,
    },
    {
        accessorKey: "status",
        header: () => <div>Estado</div>,
        cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const solicitud = row.original;

            if (solicitud.status !== 'PENDING') {
                return <span className="text-xs text-muted-foreground">Procesada</span>;
            }

            return (
                <div className="flex justify-end gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onApprove(solicitud)}
                                className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Aprobar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReject(solicitud)}
                                className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rechazar</TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
