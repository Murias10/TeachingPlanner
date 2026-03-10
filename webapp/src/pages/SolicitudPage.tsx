import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useListarSolicitudes } from "@/hooks/event-request/useListarSolicitudes";
import { useAprobarSolicitud } from "@/hooks/event-request/useAprobarSolicitud";
import { useRechazarSolicitud } from "@/hooks/event-request/useRechazarSolicitud";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { useDegreeByAcronym } from "@/hooks/degree/useDegreeByAcronym";
import { useCoursesByDegreeAcronym } from "@/hooks/course/useCoursesByDegreeAcronym";
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import { SolicitudTable } from "@/components/solicitud/SolicitudTable";
import ApproveRequestDialog, { canApproveRequestDirectly } from "@/components/solicitud/ApproveRequestDialog";
import type { RecurrenceConfig } from '@/types/RecurrenceConfig';
import moment from "moment";

interface EventRequest {
    id: string;
    professorId: string;
    calendarId: string;
    eventType: 'PUNTUAL' | 'PERIODIC';
    eventData: Record<string, undefined>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
    createdAt: string;
}

const SolicitudPage = () => {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const { triggerAlert } = useFloatingAlertContext();
    const { user, isLoading: authLoading } = useAuth();
    const listarSolicitudes = useListarSolicitudes();
    const aprobarSolicitud = useAprobarSolicitud();
    const rechazarSolicitud = useRechazarSolicitud();
    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string, startYear: string, endYear: string, semester: string }>();
    const { data: degree } = useDegreeByAcronym(acronym || null);

    // Obtener los cursos por acrónimo
    const { data: courses } = useCoursesByDegreeAcronym(acronym || null);

    // Buscar el curso específico basado en startYear y endYear
    const course = courses?.find(c =>
        c.startYear.toString() === startYear &&
        c.endYear.toString() === endYear
    );

    const [solicitudes, setSolicitudes] = useState<EventRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<EventRequest | null>(null);
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    // Get calendar data to obtain lective dates
    const { data: calendarData } = useCalendarByCourseAndSemester(
        acronym || null,
        startYear || null,
        endYear || null,
        semester || null
    );

    const lectiveDates = useMemo(() => {
        return new Set(calendarData?.lectiveDates || []);
    }, [calendarData?.lectiveDates]);

    const cargarSolicitudes = useCallback(async (filter?: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
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
    }, [statusFilter, listarSolicitudes, triggerAlert]);

    // Cargar solicitudes al montar el componente
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            // Miga intermedia con el nombre del grado (sin enlace, solo informativo)
            ...(course?.degree ? [{ label: course.degree.name, href: "" }] : []),
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            // Miga intermedia con el año académico (sin enlace, solo informativo)
            ...(course ? [{ label: `${course.startYear}/${course.endYear}`, href: "" }] : []),
            // Miga intermedia con el semestre (sin enlace, solo informativo)
            ...(semester ? [{ label: `${t("breadcrumb.semester")} ${semester}`, href: "" }] : []),
            { label: "Solicitudes", href: "" },
        ]);
        cargarSolicitudes();
    }, [setItems, t, acronym, startYear, endYear, semester, cargarSolicitudes, course]);

    // Protección: Solo ADMIN puede acceder - esperar a que termine de cargar
    if (authLoading) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/degrees" replace />;
    }

    const handleApprove = (solicitud: EventRequest) => {
        console.log('[SolicitudPage] handleApprove called with:', solicitud);

        // Validar si la solicitud tiene todos los datos necesarios
        if (!canApproveRequestDirectly(solicitud.eventData)) {
            // Faltan datos -> Abrir diálogo de revisión automáticamente
            setSelectedSolicitud(solicitud);
            setApproveDialogOpen(true);
            console.log('[SolicitudPage] Incomplete data - Opening review dialog');
            return;
        }

        // Tiene todos los datos -> Abrir diálogo de revisión (mismo comportamiento que antes)
        setSelectedSolicitud(solicitud);
        setApproveDialogOpen(true);
        console.log('[SolicitudPage] Dialog should open now');
    };

    const handleApproveWithData = async (config: RecurrenceConfig) => {
        if (!selectedSolicitud) return;

        setIsSubmitting(true);

        try {
            const result = await aprobarSolicitud(
                selectedSolicitud.id,
                config,
                () => cargarSolicitudes()
            );

            if (result.success) {
                triggerAlert({
                    title: t("calendar.alerts.request.approvedShort.title"),
                    description: t("calendar.alerts.request.approvedShort.description"),
                    variant: 'success'
                });
                setApproveDialogOpen(false);
                cargarSolicitudes();
            } else {
                const first = result.conflictData?.[0];
                let description: string;
                if (result.status === 409 && first) {
                    const groupNames = first.groupNames?.join(', ') || '';
                    const classroomNames = first.classroomNames?.join(', ') || '';
                    const startTimeShort = first.startTime?.substring(0, 5) || '';
                    const endTimeShort = first.endTime?.substring(0, 5) || '';
                    if (groupNames && classroomNames) {
                        description = t('calendar.alerts.request.approveConflict.shared_both_detail', { startTime: startTimeShort, endTime: endTimeShort, groupNames, classroomNames });
                    } else if (groupNames) {
                        description = t('calendar.alerts.request.approveConflict.shared_group_detail', { startTime: startTimeShort, endTime: endTimeShort, names: groupNames });
                    } else {
                        description = t('calendar.alerts.request.approveConflict.shared_classroom_detail', { startTime: startTimeShort, endTime: endTimeShort, names: classroomNames });
                    }
                    triggerAlert({
                        title: t('calendar.alerts.request.approveConflict.title'),
                        description,
                        variant: 'destructive'
                    });
                } else {
                    triggerAlert({
                        title: t("common.error"),
                        description: result.message || t("calendar.alerts.request.approveErrorWithMessage.description"),
                        variant: 'destructive'
                    });
                }
            }
        } catch {
            triggerAlert({
                title: t("common.error"),
                description: t("calendar.alerts.request.approveErrorGeneric.description"),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = (solicitud: EventRequest) => {
        setSelectedSolicitud(solicitud);
        setComments("");
        setRejectDialogOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedSolicitud) return;

        setIsSubmitting(true);

        try {
            const result = await rechazarSolicitud(selectedSolicitud.id, comments, () => {
                cargarSolicitudes();
            });

            if (result.success) {
                triggerAlert({
                    title: t("calendar.alerts.request.rejected.title"),
                    description: t("calendar.alerts.request.rejected.description"),
                    variant: 'success'
                });
                setRejectDialogOpen(false);
                cargarSolicitudes();
            } else {
                triggerAlert({
                    title: t("common.error"),
                    description: result.message || t("calendar.alerts.request.rejectError.description"),
                    variant: 'destructive'
                });
            }
        } catch {
            triggerAlert({
                title: t("common.error"),
                description: t("calendar.alerts.request.rejectErrorGeneric.description"),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
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
            <section className="h-full bg-background overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b bg-background">
                    <h1 className="text-2xl font-semibold text-foreground mb-1">
                        {t("requests.page.title")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("requests.page.subtitle", {
                            semester,
                            degree: degree?.name || acronym?.toUpperCase(),
                            startYear,
                            endYear
                        })}
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
                        onClick={() => cargarSolicitudes()}
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
                                onApprove={handleApprove}
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
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("requests.dialog.reject.title")}</DialogTitle>
                        <DialogDescription>
                            {t("requests.dialog.reject.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {selectedSolicitud && (
                            <>
                                <div>
                                    <label className="text-sm font-medium">{t("requests.dialog.reject.professor")}</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedSolicitud.professorId}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t("requests.dialog.reject.eventType")}</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {getEventTypeLabel(selectedSolicitud.eventType)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t("requests.dialog.reject.requestDate")}</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {moment(selectedSolicitud.createdAt).format('DD/MM/YYYY HH:mm')}
                                    </p>
                                </div>
                            </>
                        )}

                        <div>
                            <label htmlFor="comments" className="text-sm font-medium">
                                {t("requests.dialog.reject.comments")}
                            </label>
                            <Textarea
                                id="comments"
                                placeholder={t("requests.dialog.reject.commentsPlaceholder")}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="mt-2 min-h-20"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            {t("requests.dialog.reject.cancel")}
                        </Button>
                        <Button
                            onClick={handleConfirmReject}
                            disabled={isSubmitting || !comments.trim()}
                            variant="destructive"
                        >
                            {isSubmitting ? t("requests.dialog.reject.processing") : t("requests.dialog.reject.reject")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SolicitudPage;
