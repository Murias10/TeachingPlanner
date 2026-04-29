import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useCalendarSync } from "@/hooks/google/useCalendarSync";
import { useRateLimitStatus } from "@/hooks/google/useRateLimitStatus";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Calendar, RefreshCw, ArrowLeft, Settings, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useTranslation } from "react-i18next";

const CalendarSyncPage = () => {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const { user } = useAuth();
    const { triggerAlert } = useFloatingAlertContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { syncs, isSyncsLoading, toggleSync, syncNow, isLoading } = useCalendarSync();
    const { rateLimitStatus } = useRateLimitStatus(syncs);
    const { data: degrees = [] } = useDegrees();

    const [selectedDegreeId, setSelectedDegreeId] = useState<string>("all");
    const [syncsWithAccess, setSyncsWithAccess] = useState<Set<string>>(new Set());

    useEffect(() => {
        setItems([
            { label: t("settings.title"), href: "/settings", shortLabel: t("settings.title") },
            { label: t("breadcrumb.calendarSync"), href: "/calendar-sync", icon: Settings }
        ]);
    }, [setItems, t]);

    const filteredSyncs = useMemo(() => {
        if (selectedDegreeId === "all") return syncs;
        return syncs.filter(sync => sync.degreeId === selectedDegreeId);
    }, [syncs, selectedDegreeId]);

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/degrees" replace />;
    }

    const handleToggleSync = async (syncId: string) => {
        const sync = syncs.find(s => s.id === syncId);
        const isEnabling = !sync?.syncEnabled;

        const result = await toggleSync(syncId);
        if (!result.success) {
            triggerAlert({
                title: t("error.title"),
                description: result.message || t("calendarSync.toggleError"),
                variant: "destructive"
            });
            return;
        }

        if (isEnabling) {
            // Al activar, lanzar sincronización automáticamente
            await handleSyncNow(syncId);
        } else {
            triggerAlert({
                title: t("calendarSync.toggleDisabled.title"),
                description: t("calendarSync.toggleDisabled.description"),
                variant: "success"
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

        queryClient.invalidateQueries({ queryKey: ['rateLimitStatus'] });

        if (result.success) {
            triggerAlert({
                title: t("calendarSync.syncStarted.title"),
                description: result.message || t("calendarSync.syncStarted.description"),
                variant: "success"
            });
        } else {
            triggerAlert({
                title: t("error.title"),
                description: result.message || t("calendarSync.syncError"),
                variant: "destructive"
            });
        }
    };

    const getSyncStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
            'IDLE': { label: t("calendarSync.status.idle"), variant: 'secondary' },
            'SYNCING': { label: t("calendarSync.status.syncing"), variant: 'default' },
            'SUCCESS': { label: t("calendarSync.status.success"), variant: 'default' },
            'ERROR': { label: t("calendarSync.status.error"), variant: 'destructive' }
        };

        const config = statusMap[status] ?? { label: status, variant: 'secondary' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getBarColor = (percentage: number) => {
        if (percentage >= 85) return "bg-red-500";
        if (percentage >= 60) return "bg-yellow-500";
        return "bg-green-500";
    };

    const formatResetTime = (ms: number) => {
        const seconds = Math.ceil(ms / 1000);
        if (seconds <= 0) return "";
        if (seconds < 60) return t("calendarSync.quota.resetInSeconds", { seconds });
        const minutes = Math.ceil(seconds / 60);
        return t("calendarSync.quota.resetInMinutes", { minutes });
    };

    if (isSyncsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    const quota = rateLimitStatus ?? {
        minute: { used: 0, limit: 400, windowResetInMs: 0 },
        daily: { used: 0, estimatedLimit: 10000, resetInMs: 0 },
        calendarsCreatedToday: { used: 0, estimatedLimit: 150 }
    };

    return (
        <div className="p-6 space-y-6">
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
                        <h1 className="text-2xl font-bold">{t("calendarSync.title")}</h1>
                    </div>
                </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{t("calendarSync.infoNote.label")}</strong> {t("calendarSync.infoNote.text")}
                </p>
            </div>

            {/* API Quota Widget */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{t("calendarSync.quota.title")}</CardTitle>
                    </div>
                    <CardDescription>{t("calendarSync.quota.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Per-minute */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{t("calendarSync.quota.perMinute")}</span>
                            <span className="text-muted-foreground">
                                {quota.minute.used} / {quota.minute.limit}
                            </span>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${getBarColor(quota.minute.used / quota.minute.limit * 100)}`}
                                style={{ width: `${Math.min(quota.minute.used / quota.minute.limit * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatResetTime(quota.minute.windowResetInMs)}
                        </p>
                    </div>

                    {/* Daily requests */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{t("calendarSync.quota.perDay")}</span>
                            <span className="text-muted-foreground">
                                {quota.daily.used} / ~{quota.daily.estimatedLimit.toLocaleString()} {t("calendarSync.quota.estimated")}
                            </span>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${getBarColor(quota.daily.used / quota.daily.estimatedLimit * 100)}`}
                                style={{ width: `${Math.min(quota.daily.used / quota.daily.estimatedLimit * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatResetTime(quota.daily.resetInMs)}
                        </p>
                    </div>

                    {/* Calendar creations */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{t("calendarSync.quota.calendarsCreated")}</span>
                            <span className="text-muted-foreground">
                                {quota.calendarsCreatedToday.used} / ~{quota.calendarsCreatedToday.estimatedLimit} {t("calendarSync.quota.estimated")}
                            </span>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${getBarColor(quota.calendarsCreatedToday.used / quota.calendarsCreatedToday.estimatedLimit * 100)}`}
                                style={{ width: `${Math.min(quota.calendarsCreatedToday.used / quota.calendarsCreatedToday.estimatedLimit * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{t("calendarSync.quota.calendarsCreatedNote")}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Academic Calendars Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("calendarSync.card.title")}</CardTitle>
                    <CardDescription>{t("calendarSync.card.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-medium">{t("calendarSync.filterByDegree")}</span>
                        <Select value={selectedDegreeId} onValueChange={setSelectedDegreeId}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder={t("calendarSync.selectDegreePlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("calendarSync.allDegrees")}</SelectItem>
                                {degrees.map((degree) => (
                                    <SelectItem key={degree.id} value={degree.id}>
                                        {degree.acronym} - {degree.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("calendarSync.table.degree")}</TableHead>
                                    <TableHead>{t("calendarSync.table.course")}</TableHead>
                                    <TableHead>{t("calendarSync.table.semester")}</TableHead>
                                    <TableHead>{t("calendarSync.table.status")}</TableHead>
                                    <TableHead>{t("calendarSync.table.lastSync")}</TableHead>
                                    <TableHead className="text-right">{t("calendarSync.table.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSyncs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {selectedDegreeId === "all"
                                                ? t("calendarSync.table.emptyAll")
                                                : t("calendarSync.table.emptyFiltered")}
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
                                                        <span className="text-sm text-muted-foreground">{t("calendarSync.table.never")}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                {sync.syncEnabled ? t("calendarSync.table.enabled") : t("calendarSync.table.disabled")}
                                                            </span>
                                                            <Switch
                                                                checked={sync.syncEnabled}
                                                                onCheckedChange={() => handleToggleSync(sync.id)}
                                                                disabled={isLoading || sync.syncStatus === 'SYNCING'}
                                                            />
                                                        </div>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleSyncNow(sync.id)}
                                                                    disabled={isLoading || !sync.syncEnabled || sync.syncStatus === 'SYNCING' || syncsWithAccess.has(sync.id)}
                                                                >
                                                                    {syncsWithAccess.has(sync.id) || sync.syncStatus === 'SYNCING' ? (
                                                                        <Spinner />
                                                                    ) : (
                                                                        <RefreshCw className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {t("calendarSync.syncNow")}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {sync.syncStatus === 'SYNCING' && sync.totalCalendars && (
                                                <TableRow key={`${sync.id}-progress`} className="bg-muted/50 hover:bg-muted/50">
                                                    <TableCell colSpan={6} className="py-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-medium text-muted-foreground">
                                                                    {sync.currentOperation || t("calendarSync.progress.syncing")}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {sync.processedCalendars || 0} / {sync.totalCalendars} {t("calendarSync.progress.completed")}
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
