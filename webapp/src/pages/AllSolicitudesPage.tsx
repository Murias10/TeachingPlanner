import { useCallback, useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useListarSolicitudes } from "@/hooks/event-request/useListarSolicitudes";
import { useAprobarSolicitud } from "@/hooks/event-request/useAprobarSolicitud";
import { useRechazarSolicitud } from "@/hooks/event-request/useRechazarSolicitud";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { RefreshCw, ClipboardList } from "lucide-react";
import { SolicitudTable } from "@/components/solicitud/SolicitudTable";
import ApproveRequestDialog, { canApproveRequestDirectly } from "@/components/solicitud/ApproveRequestDialog";
import RejectRequestDialog from "@/components/calendar/RejectRequestDialog";
import { buildConflictDescription } from "@/utils/conflict.utils";
import type { RecurrenceConfig } from '@/types/RecurrenceConfig';
import { useEventsCalendar } from "@/hooks/calendar/useEventsCalendar";
import type { EventRequest } from '@/types/EventRequest';

const AllSolicitudesPage = () => {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const { triggerAlert } = useFloatingAlertContext();
    const { user } = useAuth();
    const listarSolicitudes = useListarSolicitudes();
    const aprobarSolicitud = useAprobarSolicitud();
    const rechazarSolicitud = useRechazarSolicitud();

    const [solicitudes, setSolicitudes] = useState<EventRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<EventRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    // Get lective dates for the selected solicitud's calendar
    const { data: calendarData } = useEventsCalendar(selectedSolicitud?.calendarId || null);

    const lectiveDates = useMemo(() => {
        return new Set(calendarData?.lectiveDates || []);
    }, [calendarData?.lectiveDates]);

    const cargarSolicitudes = useCallback(async (
        filter: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING'
    ) => {
        setIsLoading(true);
        const result = await listarSolicitudes(filter === 'all' ? undefined : filter);

        if (result.success && result.data?.requests) {
            setSolicitudes(result.data.requests);
        } else {
            triggerAlert({
                title: t('calendar.alerts.request.loadError.title'),
                description: t('calendar.alerts.request.loadError.description'),
                variant: 'destructive'
            });
        }
        setIsLoading(false);
    }, [listarSolicitudes, triggerAlert]);

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/degrees", shortLabel: t("breadcrumb.home") },
            { label: t("breadcrumb.requests"), href: "", icon: ClipboardList },
        ]);
    }, [setItems, t]);

    useEffect(() => {
        cargarSolicitudes('PENDING');
    }, [cargarSolicitudes]);

    // Protección: Solo ADMIN puede acceder
    if (user?.role !== 'ADMIN') {
        return <Navigate to="/degrees" replace />;
    }

    const handleApprove = (solicitud: EventRequest) => {
        // Validar si la solicitud tiene todos los datos necesarios
        if (!canApproveRequestDirectly(solicitud.eventData)) {
            // Faltan datos -> Abrir diálogo de revisión automáticamente
            setSelectedSolicitud(solicitud);
            setApproveDialogOpen(true);
            return;
        }

        // Tiene todos los datos -> Abrir diálogo de revisión
        setSelectedSolicitud(solicitud);
        setApproveDialogOpen(true);
    };

    const handleApproveWithData = async (config: RecurrenceConfig) => {
        if (!selectedSolicitud) return;

        setIsSubmitting(true);

        try {
            const result = await aprobarSolicitud(
                selectedSolicitud.id,
                config,
                () => cargarSolicitudes(statusFilter)
            );

            if (result.success) {
                triggerAlert({
                    title: t("calendar.alerts.request.approvedShort.title"),
                    description: t("calendar.alerts.request.approvedShort.description"),
                    variant: 'success'
                });
                setApproveDialogOpen(false);
                cargarSolicitudes(statusFilter);
            } else if (result.status === 409) {
                const description = buildConflictDescription(
                    result.conflictData?.[0],
                    {
                        both: 'calendar.alerts.request.approveConflict.shared_both_detail',
                        group: 'calendar.alerts.request.approveConflict.shared_group_detail',
                        classroom: 'calendar.alerts.request.approveConflict.shared_classroom_detail',
                    },
                    {},
                    t
                );
                if (description) {
                    triggerAlert({ title: t('calendar.alerts.request.approveConflict.title'), description, variant: 'destructive' });
                } else {
                    triggerAlert({ title: t('calendar.alerts.request.approveErrorWithMessage.title'), description: result.message || t('calendar.alerts.request.approveErrorWithMessage.description'), variant: 'destructive' });
                }
            } else {
                triggerAlert({
                    title: t('calendar.alerts.request.approveErrorWithMessage.title'),
                    description: result.message || t("calendar.alerts.request.approveErrorWithMessage.description"),
                    variant: 'destructive'
                });
            }
        } catch {
            triggerAlert({
                title: t('calendar.alerts.request.approveErrorGeneric.title'),
                description: t("calendar.alerts.request.approveErrorGeneric.description"),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = (solicitud: EventRequest) => {
        setSelectedSolicitud(solicitud);
        setRejectDialogOpen(true);
    };

    const handleRejectWithComments = async (comments: string) => {
        if (!selectedSolicitud) return;

        setIsSubmitting(true);

        try {
            const result = await rechazarSolicitud(selectedSolicitud.id, comments, () => {
                cargarSolicitudes(statusFilter);
            });

            if (result.success) {
                triggerAlert({
                    title: t("calendar.alerts.request.rejected.title"),
                    description: t("calendar.alerts.request.rejected.description"),
                    variant: 'success'
                });
                setRejectDialogOpen(false);
                cargarSolicitudes(statusFilter);
            } else {
                triggerAlert({
                    title: t('calendar.alerts.request.rejectError.title'),
                    description: result.message || t("calendar.alerts.request.rejectError.description"),
                    variant: 'destructive'
                });
            }
        } catch {
            triggerAlert({
                title: t('calendar.alerts.request.rejectErrorGeneric.title'),
                description: t("calendar.alerts.request.rejectErrorGeneric.description"),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
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
            <section className="h-full bg-background overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b bg-background">
                    <h1 className="text-2xl font-semibold text-foreground mb-1">
                        {t("requests.page.allTitle")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("requests.page.allSubtitle")}
                    </p>
                </div>

                {/* Filtros */}
                <div className="px-6 py-3 border-b bg-background flex justify-between items-center gap-4">
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
                                {status === 'PENDING' && t("requests.page.filters.pending")}
                                {status === 'APPROVED' && t("requests.page.filters.approved")}
                                {status === 'REJECTED' && t("requests.page.filters.rejected")}
                                {status === 'all' && t("requests.page.filters.all")}
                            </Button>
                        ))}
                    </div>
                    <button
                        onClick={() => cargarSolicitudes(statusFilter)}
                        disabled={isLoading}
                        className="p-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t("requests.page.refresh")}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Tabla de solicitudes */}
                <div className="flex-1 overflow-auto px-6 py-4 min-h-0">
                    {isLoading && solicitudes.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="h-full">
                            <SolicitudTable
                                solicitudes={solicitudes}
                                onReject={handleReject}
                                onReview={handleApprove}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Approve Request Dialog */}
            <ApproveRequestDialog
                open={approveDialogOpen}
                onOpenChange={setApproveDialogOpen}
                solicitud={selectedSolicitud}
                onApprove={handleApproveWithData}
                isSubmitting={isSubmitting}
                lectiveDates={lectiveDates}
                calendarEndDate={calendarData?.endDate}
            />

            {/* Reject Request Dialog */}
            <RejectRequestDialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
                onReject={handleRejectWithComments}
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default AllSolicitudesPage;