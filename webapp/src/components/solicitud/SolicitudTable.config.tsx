import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, X, Eye, Trash2 } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import moment from "moment"
import { TFunction } from "i18next"
import type { EventRequest } from "@/types/EventRequest"

const getRequestTypeBadge = (requestType: string, t: TFunction) => {
    const variant = requestType === 'CANCEL' ? 'destructive' : 'secondary';
    const label = t(`table.solicitudes.requestType.${requestType.toLowerCase()}` as any) || requestType;
    return <Badge variant={variant}>{label}</Badge>;
};

interface ColumnExtraProps {
    onReject?: (solicitud: EventRequest) => void;
    onReview?: (solicitud: EventRequest) => void;
    onDelete?: (solicitud: EventRequest) => void;
    t: TFunction;
}

const getStatusBadge = (status: string, t: TFunction) => {
    switch (status) {
        case 'PENDING':
            return <Badge className="bg-amber-200 text-amber-900">{t("table.solicitudes.status.pending")}</Badge>;
        case 'APPROVED':
            return <Badge className="bg-emerald-200 text-emerald-900">{t("table.solicitudes.status.approved")}</Badge>;
        case 'REJECTED':
            return <Badge className="bg-rose-200 text-rose-900">{t("table.solicitudes.status.rejected")}</Badge>;
        default:
            return <Badge>{t("table.solicitudes.status.pending")}</Badge>;
    }
};

const getEventTypeLabel = (eventType: string, t: TFunction) => {
    return eventType === 'PUNTUAL' ? t("requests.dialog.approve.eventType.punctual") : t("requests.dialog.approve.eventType.periodic");
};

export const columns = ({ onReject, onReview, onDelete, t }: ColumnExtraProps): ColumnDef<EventRequest>[] => [
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
        header: () => <div>{t("table.solicitudes.columns.degreeAcronym")}</div>,
        cell: ({ row }) => {
            const acronym = row.original.degreeAcronym;
            const name = row.original.degreeName;
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="font-medium cursor-help">{acronym || '-'}</div>
                    </TooltipTrigger>
                    <TooltipContent>{name || t("filters.notAvailable")}</TooltipContent>
                </Tooltip>
            );
        },
        meta: {
            label: t("table.solicitudes.columns.degreeAcronym")
        }
    },
    {
        id: "courseYear",
        header: () => <div>{t("table.solicitudes.columns.courseYear")}</div>,
        cell: ({ row }) => {
            const startYear = row.original.courseStartYear;
            const endYear = row.original.courseEndYear;
            return <div>{startYear && endYear ? `${startYear}-${endYear}` : '-'}</div>;
        },
        meta: {
            label: t("table.solicitudes.columns.courseYear")
        }
    },
    {
        accessorKey: "semester",
        header: () => <div>{t("table.solicitudes.columns.semester")}</div>,
        cell: ({ row }) => {
            const semester = row.getValue("semester") as number | null;
            return <div>{semester ? String(semester) : '-'}</div>;
        },
        meta: {
            label: t("table.solicitudes.columns.semester")
        }
    },
    {
        accessorKey: "requestType",
        header: () => <div>{t("table.solicitudes.columns.requestType")}</div>,
        cell: ({ row }) => {
            const rt = (row.getValue("requestType") as string) || 'CREATE';
            return getRequestTypeBadge(rt, t);
        },
        meta: {
            label: t("table.solicitudes.columns.requestType")
        }
    },
    {
        accessorKey: "eventType",
        header: () => <div>{t("table.solicitudes.columns.eventType")}</div>,
        cell: ({ row }) => <div>{getEventTypeLabel(row.getValue("eventType"), t)}</div>,
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
        cell: ({ row }) => getStatusBadge(row.getValue("status"), t),
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
                return <span className="text-xs text-muted-foreground">{t("table.solicitudes.status.processed")}</span>;
            }

            // Modo profesor: solo botón de eliminar
            if (onDelete && !onReject) {
                return (
                    <div className="flex justify-end gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(solicitud)}
                                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("table.solicitudes.actions.delete")}</TooltipContent>
                        </Tooltip>
                    </div>
                );
            }

            // Modo admin: revisar, rechazar
            return (
                <div className="flex justify-end gap-1">
                    {onReview && (
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
                            <TooltipContent>{t("table.solicitudes.actions.review")}</TooltipContent>
                        </Tooltip>
                    )}
                    {onReject && (
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
                            <TooltipContent>{t("table.solicitudes.actions.reject")}</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        },
        meta: {
            label: t("table.solicitudes.columns.actions")
        }
    },
];
