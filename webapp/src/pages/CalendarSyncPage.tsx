import { useEffect, useState } from "react";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useCalendarSync } from "@/hooks/google/useCalendarSync";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";
import { Navigate, useNavigate } from "react-router-dom";
import { Calendar, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import { useCoursesByDegreeId } from "@/hooks/course/useCoursesByDegreeId";
import { useDegrees } from "@/hooks/degree/useDegrees";

const CalendarSyncPage = () => {
    const { setItems } = useBreadcrumbContext();
    const { user } = useAuth();
    const { triggerAlert } = useFloatingAlert();
    const navigate = useNavigate();
    const { syncs, isSyncsLoading, createSync, deleteSync, toggleSync, syncNow, isLoading } = useCalendarSync();
    const { data: degrees = [] } = useDegrees();

    const [selectedDegreeId, setSelectedDegreeId] = useState<string | null>(null);
    const { data: courses = [] } = useCoursesByDegreeId(selectedDegreeId);

    useEffect(() => {
        setItems([
            { label: "Ajustes", href: "/settings" },
            { label: "Sincronización con Google", href: "/calendar-sync" }
        ]);
    }, [setItems]);

    // Seleccionar el primer grado por defecto
    useEffect(() => {
        if (degrees.length > 0 && !selectedDegreeId) {
            setSelectedDegreeId(degrees[0].id);
        }
    }, [degrees, selectedDegreeId]);

    // Protección: Solo ADMIN puede acceder
    if (user?.role !== 'ADMIN') {
        return <Navigate to="/degrees" replace />;
    }

    const handleCreateSync = async (calendarId: string) => {
        const result = await createSync(calendarId);
        if (result.success) {
            triggerAlert({
                title: "Sincronización creada",
                description: "El calendario se sincronizará automáticamente con Google Calendar",
                variant: "success"
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message || "Error al crear sincronización",
                variant: "destructive"
            });
        }
    };

    const handleDeleteSync = async (syncId: string) => {
        const result = await deleteSync(syncId);
        if (result.success) {
            triggerAlert({
                title: "Sincronización eliminada",
                description: "El calendario ya no se sincronizará con Google Calendar",
                variant: "success"
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message || "Error al eliminar sincronización",
                variant: "destructive"
            });
        }
    };

    const handleToggleSync = async (syncId: string) => {
        const result = await toggleSync(syncId);
        if (result.success) {
            triggerAlert({
                title: "Estado actualizado",
                description: "El estado de la sincronización ha sido actualizado",
                variant: "success"
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message || "Error al actualizar estado",
                variant: "destructive"
            });
        }
    };

    const handleSyncNow = async (syncId: string) => {
        const result = await syncNow(syncId);
        if (result.success) {
            triggerAlert({
                title: "Sincronización iniciada",
                description: result.message || "La sincronización se está ejecutando",
                variant: "success"
            });
        } else {
            triggerAlert({
                title: "Error",
                description: result.message || "Error al sincronizar",
                variant: "destructive"
            });
        }
    };

    const isSynced = (calendarId: string) => {
        return syncs.some(sync => sync.calendarId === calendarId);
    };

    const getSyncForCalendar = (calendarId: string) => {
        return syncs.find(sync => sync.calendarId === calendarId);
    };

    if (isSyncsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/settings')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        <h1 className="text-2xl font-bold">Sincronización con Google Calendar</h1>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Nota:</strong> Los calendarios sincronizados se actualizarán automáticamente cada 5 minutos.
                            Los cambios en TeachingPlanner se reflejarán en Google Calendar y viceversa.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Selector de Grado */}
            <Card>
                <CardHeader>
                    <CardTitle>Selecciona un Grado</CardTitle>
                    <CardDescription>Elige el grado para ver sus calendarios disponibles</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {degrees.map((degree) => (
                            <Button
                                key={degree.id}
                                variant={selectedDegreeId === degree.id ? "default" : "outline"}
                                onClick={() => setSelectedDegreeId(degree.id)}
                                className="justify-start"
                            >
                                {degree.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Calendarios (Cursos) */}
            {selectedDegreeId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Calendarios Disponibles</CardTitle>
                        <CardDescription>
                            Gestiona qué calendarios se sincronizan con Google Calendar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {courses.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No hay cursos disponibles para este grado
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {courses.map((course) => {
                                    const calendars = course.calendars.map((calendar, index) => ({
                                        id: calendar.id,
                                        name: `${course.startYear}/${course.endYear} - Semestre ${index + 1}`,
                                        semester: index + 1
                                    }));

                                    return calendars.map((calendar) => {
                                        const sync = getSyncForCalendar(calendar.id);
                                        const synced = isSynced(calendar.id);

                                        return (
                                            <div
                                                key={calendar.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                                    <div className="flex-1">
                                                        <p className="font-medium">{calendar.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {degrees.find(d => d.id === selectedDegreeId)?.acronym}
                                                        </p>
                                                    </div>

                                                    {synced && (
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={sync?.syncEnabled ? "default" : "secondary"}>
                                                                {sync?.syncEnabled ? "Activo" : "Pausado"}
                                                            </Badge>
                                                            {sync?.lastSyncAt && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Última sync: {new Date(sync.lastSyncAt).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {synced && sync ? (
                                                        <>
                                                            <Switch
                                                                checked={sync.syncEnabled}
                                                                onCheckedChange={() => handleToggleSync(sync.id)}
                                                                disabled={isLoading}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => handleSyncNow(sync.id)}
                                                                disabled={isLoading || !sync.syncEnabled}
                                                                title="Sincronizar ahora"
                                                            >
                                                                {isLoading ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => handleDeleteSync(sync.id)}
                                                                disabled={isLoading}
                                                                title="Eliminar sincronización"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleCreateSync(calendar.id)}
                                                            disabled={isLoading}
                                                        >
                                                            {isLoading && <Spinner />}
                                                            Sincronizar
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CalendarSyncPage;
