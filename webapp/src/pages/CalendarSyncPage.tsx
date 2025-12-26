import { useEffect, useState, useMemo } from "react";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useCalendarSync } from "@/hooks/google/useCalendarSync";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";
import { Navigate, useNavigate } from "react-router-dom";
import { Calendar, RefreshCw, ArrowLeft } from "lucide-react";
import { useDegrees } from "@/hooks/degree/useDegrees";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const CalendarSyncPage = () => {
    const { setItems } = useBreadcrumbContext();
    const { user } = useAuth();
    const { triggerAlert } = useFloatingAlert();
    const navigate = useNavigate();
    const { syncs, isSyncsLoading, toggleSync, syncNow, isLoading } = useCalendarSync();
    const { data: degrees = [] } = useDegrees();

    const [selectedDegreeId, setSelectedDegreeId] = useState<string>("all");
    const [syncsWithAccess, setSyncsWithAccess] = useState<Set<string>>(new Set());

    useEffect(() => {
        setItems([
            { label: "Ajustes", href: "/settings" },
            { label: "Sincronización con Google", href: "/calendar-sync" }
        ]);
    }, [setItems]);

    // Filtrar calendarios por titulación
    const filteredSyncs = useMemo(() => {
        if (selectedDegreeId === "all") {
            return syncs;
        }
        return syncs.filter(sync => sync.degreeId === selectedDegreeId);
    }, [syncs, selectedDegreeId]);

    // Protección: Solo ADMIN puede acceder
    if (user?.role !== 'ADMIN') {
        return <Navigate to="/degrees" replace />;
    }

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
        setSyncsWithAccess(prev => new Set(prev).add(syncId));

        const result = await syncNow(syncId);

        setSyncsWithAccess(prev => {
            const newSet = new Set(prev);
            newSet.delete(syncId);
            return newSet;
        });

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

    const getSyncStatusBadge = (status: string) => {
        const statusMap = {
            'IDLE': { label: 'Inactivo', variant: 'secondary' as const },
            'SYNCING': { label: 'Sincronizando', variant: 'default' as const },
            'SUCCESS': { label: 'Éxito', variant: 'default' as const },
            'ERROR': { label: 'Error', variant: 'destructive' as const }
        };

        const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Cuando actives un calendario académico y lo sincronices, se crearán automáticamente Google Calendars
                    para las aulas que tengan eventos de ese calendario. Los eventos se distribuirán a las aulas según su ubicación.
                    La sincronización es manual - usa el botón "Sincronizar ahora" para actualizar los calendarios.
                </p>
            </div>

            {/* Toolbar con selector de titulación */}
            <Card>
                <CardHeader>
                    <CardTitle>Calendarios Académicos</CardTitle>
                    <CardDescription>
                        Activa o desactiva la sincronización de calendarios académicos con Google Calendar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-medium">Filtrar por titulación:</span>
                        <Select value={selectedDegreeId} onValueChange={setSelectedDegreeId}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Selecciona una titulación" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las titulaciones</SelectItem>
                                {degrees.map((degree) => (
                                    <SelectItem key={degree.id} value={degree.id}>
                                        {degree.acronym} - {degree.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titulación</TableHead>
                                    <TableHead>Curso</TableHead>
                                    <TableHead>Semestre</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Última Sincronización</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSyncs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {selectedDegreeId === "all"
                                                ? "No hay calendarios académicos disponibles"
                                                : "No hay calendarios para esta titulación"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSyncs.map((sync) => (
                                        <>
                                            <TableRow key={sync.id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div className="font-semibold">{sync.degreeAcronym}</div>
                                                        <div className="text-xs text-muted-foreground">{sync.degreeName}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{sync.courseName}</TableCell>
                                                <TableCell>{sync.semester}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-2">
                                                        {getSyncStatusBadge(sync.syncStatus)}
                                                        {sync.errorMessage && (
                                                            <span className="text-xs text-destructive">
                                                                {sync.errorMessage}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {sync.lastSyncAt ? (
                                                        <span className="text-sm">
                                                            {new Date(sync.lastSyncAt).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Nunca</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                {sync.syncEnabled ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                            <Switch
                                                                checked={sync.syncEnabled}
                                                                onCheckedChange={() => handleToggleSync(sync.id)}
                                                                disabled={isLoading || sync.syncStatus === 'SYNCING'}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleSyncNow(sync.id)}
                                                            disabled={isLoading || !sync.syncEnabled || sync.syncStatus === 'SYNCING' || syncsWithAccess.has(sync.id)}
                                                            title="Sincronizar ahora"
                                                        >
                                                            {syncsWithAccess.has(sync.id) || sync.syncStatus === 'SYNCING' ? (
                                                                <Spinner />
                                                            ) : (
                                                                <RefreshCw className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {/* Progress row - shown only when syncing */}
                                            {sync.syncStatus === 'SYNCING' && sync.totalCalendars && (
                                                <TableRow key={`${sync.id}-progress`} className="bg-muted/50 hover:bg-muted/50">
                                                    <TableCell colSpan={6} className="py-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-medium text-muted-foreground">
                                                                    {sync.currentOperation || 'Sincronizando...'}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {sync.processedCalendars || 0} / {sync.totalCalendars} completados
                                                                </span>
                                                            </div>
                                                            <Progress
                                                                value={(sync.processedCalendars || 0) / sync.totalCalendars * 100}
                                                                className="h-2"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CalendarSyncPage;
