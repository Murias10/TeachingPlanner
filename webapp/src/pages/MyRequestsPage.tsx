import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useListarMisSolicitudes } from "@/hooks/event-request/useListarMisSolicitudes";
import { useDeleteRequest } from "@/hooks/event-request/useDeleteRequest";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { SolicitudTable } from "@/components/solicitud/SolicitudTable";
import type { EventRequest } from "@/types/EventRequest";

const MyRequestsPage = () => {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const { triggerAlert } = useFloatingAlertContext();
    const { user } = useAuth();
    const listarMisSolicitudes = useListarMisSolicitudes();
    const deleteRequest = useDeleteRequest();

    const [solicitudes, setSolicitudes] = useState<EventRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    // Protección: Solo PROFESSOR puede acceder
    if (user?.role !== 'PROFESSOR') {
        return <Navigate to="/degrees" replace />;
    }

    const cargarSolicitudes = useCallback(async (
        filter: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING'
    ) => {
        setIsLoading(true);
        const result = await listarMisSolicitudes(filter === 'all' ? undefined : filter);

        if (result.success && result.data?.requests) {
            setSolicitudes(result.data.requests);
        } else {
            triggerAlert({
                title: t("common.error"),
                description: 'No se pudieron cargar las solicitudes',
                variant: 'destructive'
            });
        }
        setIsLoading(false);
    }, [listarMisSolicitudes, triggerAlert, t]);

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/degrees" },
            { label: t("sidebar.system.myRequests.title"), href: "" },
        ]);
        cargarSolicitudes('PENDING');
    }, [setItems, t, cargarSolicitudes]);

    const handleDelete = async (solicitud: EventRequest) => {
        const result = await deleteRequest(solicitud.id, () => cargarSolicitudes(statusFilter));

        if (result.success) {
            triggerAlert({
                title: t("calendar.alerts.request.deleted.title"),
                description: t("calendar.alerts.request.deleted.description"),
                variant: 'success'
            });
        } else {
            triggerAlert({
                title: t("common.error"),
                description: result.message || t("calendar.alerts.request.deleteError.description"),
                variant: 'destructive'
            });
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
        <section className="h-full bg-background overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b bg-background">
                <h1 className="text-2xl font-semibold text-foreground mb-1">
                    {t("sidebar.system.myRequests.title")}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t("myRequests.page.subtitle")}
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

            {/* Tabla */}
            <div className="flex-1 overflow-auto px-6 py-4 min-h-0">
                {isLoading && solicitudes.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="h-full">
                        <SolicitudTable
                            solicitudes={solicitudes}
                            onDelete={handleDelete}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default MyRequestsPage;
