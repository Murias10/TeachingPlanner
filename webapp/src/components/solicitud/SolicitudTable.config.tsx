import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Check, X, Eye } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import moment from "moment"
import { TFunction } from "i18next"

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

const REQUEST_TYPE_LABELS: Record<string, string> = {
    CREATE: 'Crear',
    EDIT: 'Editar',
    CANCEL: 'Cancelar',
    REPLACE: 'Reemplazar',
};

const getRequestTypeBadge = (requestType: string) => {
    const variant = requestType === 'CANCEL' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{REQUEST_TYPE_LABELS[requestType] || requestType}</Badge>;
};

interface ColumnExtraProps {
    onApprove: (solicitud: EventRequest) => void;
    onReject: (solicitud: EventRequest) => void;
    onReview: (solicitud: EventRequest) => void;
    t: TFunction;
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

export const columns = ({ onApprove, onReject, onReview, t }: ColumnExtraProps): ColumnDef<EventRequest>[] => [
    {
        accessorKey: "professorId",
        enableHiding: false,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.solicitudes.columns.professorId")}
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("professorId")}</div>,
        meta: {
            label: t("table.solicitudes.columns.professorId")
        }
    },
    {
        accessorKey: "degreeAcronym",
        header: () => <div>Titulación</div>,
        cell: ({ row }) => {
            const acronym = row.original.degreeAcronym;
            const name = row.original.degreeName;
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="font-medium cursor-help">{acronym || '-'}</div>
                    </TooltipTrigger>
                    <TooltipContent>{name || 'Sin información'}</TooltipContent>
                </Tooltip>
            );
        },
        meta: {
            label: "Titulación"
        }
    },
    {
        id: "courseYear",
        header: () => <div>Curso</div>,
        cell: ({ row }) => {
            const startYear = row.original.courseStartYear;
            const endYear = row.original.courseEndYear;
            return <div>{startYear && endYear ? `${startYear}-${endYear}` : '-'}</div>;
        },
        meta: {
            label: "Curso"
        }
    },
    {
        accessorKey: "semester",
        header: () => <div>Semestre</div>,
        cell: ({ row }) => {
            const semester = row.getValue("semester") as number | null;
            return <div>{semester ? String(semester) : '-'}</div>;
        },
        meta: {
            label: "Semestre"
        }
    },
    {
        accessorKey: "requestType",
        header: () => <div>Tipo solicitud</div>,
        cell: ({ row }) => {
            const rt = (row.getValue("requestType") as string) || 'CREATE';
            return getRequestTypeBadge(rt);
        },
        meta: {
            label: "Tipo solicitud"
        }
    },
    {
        accessorKey: "eventType",
        header: () => <div>{t("table.solicitudes.columns.eventType")}</div>,
        cell: ({ row }) => <div>{getEventTypeLabel(row.getValue("eventType"))}</div>,
        meta: {
            label: t("table.solicitudes.columns.eventType")
        }
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
                {t("table.solicitudes.columns.createdAt")}
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div>{moment(row.getValue("createdAt")).format('DD/MM/YYYY HH:mm')}</div>,
        meta: {
            label: t("table.solicitudes.columns.createdAt")
        }
    },
    {
        accessorKey: "status",
        header: () => <div>{t("table.solicitudes.columns.status")}</div>,
        cell: ({ row }) => getStatusBadge(row.getValue("status")),
        meta: {
            label: t("table.solicitudes.columns.status")
        }
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
                                onClick={() => onReview(solicitud)}
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Revisar solicitud</TooltipContent>
                    </Tooltip>
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
                        <TooltipContent>Aprobar directamente</TooltipContent>
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
        meta: {
            label: t("table.solicitudes.columns.actions")
        }
    },
];
