import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useListarSolicitudes } from "@/hooks/event-request/useListarSolicitudes";
import { useAprobarSolicitud } from "@/hooks/event-request/useAprobarSolicitud";
import { useRechazarSolicitud } from "@/hooks/event-request/useRechazarSolicitud";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, RefreshCw, Check, X } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import moment from "moment";

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

type ActionType = 'approve' | 'reject' | null;

const SolicitudPage = () => {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const { triggerAlert } = useFloatingAlert();
    const { user } = useAuth();
    const listarSolicitudes = useListarSolicitudes();
    const aprobarSolicitud = useAprobarSolicitud();
    const rechazarSolicitud = useRechazarSolicitud();
    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string, startYear: string, endYear: string, semester: string }>();

    const [solicitudes, setSolicitudes] = useState<EventRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<EventRequest | null>(null);
    const [actionType, setActionType] = useState<ActionType>(null);
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    // Protección: Solo ADMIN puede acceder
    if (user?.role !== 'ADMIN') {
        return <Navigate to="/home" replace />;
    }

    // Cargar solicitudes al montar el componente
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            { label: t("breadcrumb.calendar"), href: `/degrees/${acronym}/courses/${startYear}/${endYear}/semester/${semester}/calendar` },
            { label: "Solicitudes", href: "" },
        ]);
        cargarSolicitudes();
    }, [setItems, t, acronym, startYear, endYear, semester]);

    const cargarSolicitudes = async (filter?: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
        setIsLoading(true);
        const filterToUse = filter ?? statusFilter;
        const result = await listarSolicitudes(
            filterToUse === 'all' ? undefined : filterToUse
        );

        if (result.success && result.data?.requests) {
            setSolicitudes(result.data.requests);
        } else {
            triggerAlert({
                title: 'Error',
                description: 'No se pudieron cargar las solicitudes',
                variant: 'destructive'
            });
        }
        setIsLoading(false);
    };

    const handleOpenActionDialog = (solicitud: EventRequest, action: ActionType) => {
        setSelectedSolicitud(solicitud);
        setActionType(action);
        setComments("");
        setActionDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedSolicitud || !actionType) return;

        setIsSubmitting(true);

        try {
            let result;

            if (actionType === 'approve') {
                result = await aprobarSolicitud(selectedSolicitud.id, () => {
                    cargarSolicitudes();
                });
            } else {
                result = await rechazarSolicitud(selectedSolicitud.id, comments, () => {
                    cargarSolicitudes();
                });
            }

            if (result.success) {
                triggerAlert({
                    title: actionType === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada',
                    description: actionType === 'approve'
                        ? 'El evento ha sido creado exitosamente'
                        : 'La solicitud ha sido rechazada',
                    variant: 'success'
                });
                setActionDialogOpen(false);
                cargarSolicitudes();
            } else {
                triggerAlert({
                    title: 'Error',
                    description: result.message || 'Error al procesar la solicitud',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            triggerAlert({
                title: 'Error',
                description: 'Ocurrió un error al procesar la solicitud',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
            case 'APPROVED':
                return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
            default:
                return <Badge>Desconocido</Badge>;
        }
    };

    const getEventTypeLabel = (eventType: string) => {
        return eventType === 'PUNTUAL' ? 'Puntual' : 'Periódica';
    };

    if (isLoading && solicitudes.length === 0) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="h-full bg-muted/50 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b bg-card">
                    <h1 className="text-2xl font-semibold text-foreground mb-2">
                        Solicitudes de Eventos
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Gestiona las solicitudes de eventos enviadas por los profesores
                    </p>
                </div>

                {/* Toolbar con filtros */}
                <div className="px-8 py-4 border-b bg-card flex justify-between items-center gap-4">
                    <div className="flex gap-2">
                        {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? "default" : "outline"}
                                onClick={() => {
                                    setStatusFilter(status);
                                    cargarSolicitudes(status);
                                }}
                                size="sm"
                            >
                                {status === 'PENDING' && 'Pendientes'}
                                {status === 'APPROVED' && 'Aprobadas'}
                                {status === 'REJECTED' && 'Rechazadas'}
                                {status === 'all' && 'Todas'}
                            </Button>
                        ))}
                    </div>
                    <button
                        onClick={() => cargarSolicitudes()}
                        disabled={isLoading}
                        className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Actualizar solicitudes"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Tabla de solicitudes */}
                <div className="flex-1 overflow-auto px-8 py-6">
                    {solicitudes.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-muted-foreground mb-2">
                                    No hay solicitudes para mostrar
                                </p>
                                <p className="text-sm text-muted-foreground/70">
                                    Intenta cambiar los filtros o actualizar la página
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-card overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Profesor</TableHead>
                                        <TableHead>Tipo de Evento</TableHead>
                                        <TableHead>Fecha de Solicitud</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {solicitudes.map((solicitud) => (
                                        <TableRow key={solicitud.id}>
                                            <TableCell className="font-medium">
                                                {solicitud.teacherId}
                                            </TableCell>
                                            <TableCell>
                                                {getEventTypeLabel(solicitud.eventType)}
                                            </TableCell>
                                            <TableCell>
                                                {moment(solicitud.createdAt).format('DD/MM/YYYY HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(solicitud.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {solicitud.status === 'PENDING' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOpenActionDialog(solicitud, 'approve')}
                                                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Aprobar</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOpenActionDialog(solicitud, 'reject')}
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Rechazar</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                )}
                                                {solicitud.status !== 'PENDING' && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Procesada
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </section>

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? 'Se creará un evento basado en los datos de la solicitud'
                                : 'Asegúrate de proporcionar un comentario sobre el motivo del rechazo'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {selectedSolicitud && (
                            <>
                                <div>
                                    <label className="text-sm font-medium">Profesor</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedSolicitud.teacherId}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Tipo de evento</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {getEventTypeLabel(selectedSolicitud.eventType)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Fecha de solicitud</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {moment(selectedSolicitud.createdAt).format('DD/MM/YYYY HH:mm')}
                                    </p>
                                </div>
                            </>
                        )}

                        {actionType === 'reject' && (
                            <div>
                                <label htmlFor="comments" className="text-sm font-medium">
                                    Comentarios
                                </label>
                                <Textarea
                                    id="comments"
                                    placeholder="Proporciona un comentario sobre el motivo del rechazo..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="mt-2 min-h-20"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setActionDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmAction}
                            disabled={isSubmitting || (actionType === 'reject' && !comments.trim())}
                            variant={actionType === 'approve' ? 'default' : 'destructive'}
                        >
                            {isSubmitting ? 'Procesando...' : (actionType === 'approve' ? 'Aprobar' : 'Rechazar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SolicitudPage;
