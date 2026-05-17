import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useCalendarSync, SyncStatus, CALENDAR_SYNCS_QUERY_KEY } from "@/hooks/google/useCalendarSync";
import { useRateLimitStatus } from "@/hooks/google/useRateLimitStatus";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Calendar, RefreshCw, ArrowLeft, Settings, Info, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDegrees } from "@/hooks/degree/useDegrees";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const DEFAULT_QUOTA = {
    minute: { used: 0, limit: 400, windowResetInMs: 0 },
    daily: { used: 0, estimatedLimit: 10000, resetInMs: 0 },
    calendarsCreatedToday: { used: 0, estimatedLimit: 150 }
} as const;

const GOOGLE_ERROR_PREFIX = 'errorCode:';

function calcMinutesUntil(isoDate?: string): number {
    if (!isoDate) return 15;
    const diffMs = new Date(isoDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diffMs / 60_000));
}

/**
 * Maps a structured backend error token (errorCode:<CODE>[:<JSON>]) to a translated string.
 * Falls back to displaying the raw message for legacy non-structured errors.
 */
function useParseErrorMessage() {
    const { t } = useTranslation();
    return (raw: string | undefined): string => {
        if (!raw) return '';
        if (!raw.startsWith(GOOGLE_ERROR_PREFIX)) return raw;

        const withoutPrefix = raw.slice(GOOGLE_ERROR_PREFIX.length);
        const colonIdx = withoutPrefix.indexOf(':');
        const code = colonIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, colonIdx);

        let params: Record<string, string> = {};
        if (colonIdx !== -1) {
            try {
                params = JSON.parse(withoutPrefix.slice(colonIdx + 1)) as Record<string, string>;
            } catch { /* malformed params — translate without interpolation */ }
        }

        const i18nKey = `calendarSync.syncErrors.${code
            .replace('GOOGLE_TOKEN_EXPIRED', 'tokenExpired')
            .replace('GOOGLE_RATE_LIMIT', 'rateLimit')
            .replace('GOOGLE_QUOTA_EXCEEDED', 'quotaExceeded')
            .replace('GOOGLE_SERVER_ERROR', 'serverError')
            .replace('GOOGLE_NETWORK_ERROR', 'networkError')
            .replace('GOOGLE_CALENDAR_PARTIAL', 'partialFailure')
            .replace('GOOGLE_UNKNOWN', 'unknown')}`;

        return t(i18nKey, params);
    };
}

const CalendarSyncPage = () => {
    const { t } = useTranslation();
    const parseErrorMessage = useParseErrorMessage();
    const { setItems } = useBreadcrumbContext();
    const { user } = useAuth();
    const { triggerAlert } = useFloatingAlertContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { syncs, isSyncsLoading, deleteSync, syncNow, isLoading } = useCalendarSync();
    const { rateLimitStatus } = useRateLimitStatus(syncs);
    const { data: degrees = [] } = useDegrees();

    const [selectedDegreeId, setSelectedDegreeId] = useState<string>("all");
    const [syncToDelete, setSyncToDelete] = useState<{ id: string; degreeName: string; courseName: string; semester: string } | null>(null);

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

    const semesterLabels = useMemo<Record<string, string>>(() => ({
        '1': t('calendarSync.semester.1'),
        '2': t('calendarSync.semester.2'),
    }), [t]);

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/degrees" replace />;
    }

    const handleDeleteSync = async () => {
        if (!syncToDelete) return;
        const result = await deleteSync(syncToDelete.id);
        setSyncToDelete(null);
        if (!result.success) {
            triggerAlert({
                title: t("error.title"),
                description: result.message || t("calendarSync.deleteError"),
                variant: "destructive"
            });
        }
    };

    const handleSyncNow = async (syncId: string) => {
        const result = await syncNow(syncId, t("calendarSync.progress.starting"));

        queryClient.invalidateQueries({ queryKey: CALENDAR_SYNCS_QUERY_KEY });

        if (result.success) {
            triggerAlert({
                title: t("calendarSync.syncStarted.title"),
                description: t("calendarSync.syncStarted.description"),
                variant: "success"
            });
        } else {
            triggerAlert({
                title: t("error.title"),
                description: t("calendarSync.syncError"),
                variant: "destructive"
            });
        }
    };

    const getSyncStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
            [SyncStatus.IDLE]:          { label: t("calendarSync.status.idle"),          variant: 'secondary' },
            [SyncStatus.SYNCING]:       { label: t("calendarSync.status.syncing"),       variant: 'default' },
            [SyncStatus.SUCCESS]:       { label: t("calendarSync.status.success"),       variant: 'default' },
            [SyncStatus.ERROR]:         { label: t("calendarSync.status.error"),         variant: 'destructive' },
            [SyncStatus.DELETING]:      { label: t("calendarSync.status.deleting"),      variant: 'secondary' },
            [SyncStatus.PENDING_RETRY]: { label: t("calendarSync.status.pendingRetry"),  variant: 'secondary' },
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

    const quota = rateLimitStatus ?? DEFAULT_QUOTA;

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
                                                        {sync.syncStatus === SyncStatus.PENDING_RETRY && (() => {
                                                            const minutes = calcMinutesUntil(sync.nextRetryAt);
                                                            return (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {minutes <= 1
                                                                        ? t("calendarSync.retryImminent")
                                                                        : t("calendarSync.retryInfo", {
                                                                            attempt: sync.retryCount ?? 1,
                                                                            maxAttempts: 5,
                                                                            minutes
                                                                        })
                                                                    }
                                                                </span>
                                                            );
                                                        })()}
                                                        {sync.syncStatus === SyncStatus.SYNCING && sync.currentOperation && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {sync.currentOperation}
                                                            </span>
                                                        )}
                                                        {sync.errorMessage && sync.syncStatus === SyncStatus.ERROR && (
                                                            <span className="text-xs text-destructive">
                                                                {parseErrorMessage(sync.errorMessage)}
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
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleSyncNow(sync.id)}
                                                                    disabled={isLoading || sync.syncStatus === SyncStatus.SYNCING || sync.syncStatus === SyncStatus.DELETING || sync.syncStatus === SyncStatus.PENDING_RETRY}
                                                                >
                                                                    {(sync.syncStatus === SyncStatus.SYNCING || sync.syncStatus === SyncStatus.PENDING_RETRY) ? (
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
                                                        {(sync.syncStatus !== SyncStatus.IDLE || sync.lastSyncAt) && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => setSyncToDelete({ id: sync.id, degreeName: sync.degreeName, courseName: sync.courseName, semester: semesterLabels[sync.semester] ?? sync.semester })}
                                                                        disabled={isLoading || sync.syncStatus === SyncStatus.SYNCING || sync.syncStatus === SyncStatus.DELETING || sync.syncStatus === SyncStatus.PENDING_RETRY}
                                                                    >
                                                                        {sync.syncStatus === SyncStatus.DELETING ? (
                                                                            <Spinner />
                                                                        ) : (
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {t("calendarSync.deleteSync")}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {sync.syncStatus === SyncStatus.SYNCING && sync.totalCalendars && (
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

            <AlertDialog open={!!syncToDelete} onOpenChange={(open) => { if (!open) setSyncToDelete(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("calendarSync.deleteDialog.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("calendarSync.deleteDialog.description", { degreeName: syncToDelete?.degreeName, courseName: syncToDelete?.courseName, semester: syncToDelete?.semester })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSync}>
                            {t("common.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CalendarSyncPage;
