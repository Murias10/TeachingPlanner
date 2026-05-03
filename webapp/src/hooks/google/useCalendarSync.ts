import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

export enum SyncStatus {
    IDLE = 'IDLE',
    SYNCING = 'SYNCING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    DELETING = 'DELETING',
}

export interface CalendarSync {
    id: string;
    calendarId: string;
    courseName: string;
    semester: string;
    degreeId: string;
    degreeName: string;
    degreeAcronym: string;
    syncStatus: SyncStatus;
    lastSyncAt?: string;
    errorMessage?: string;
    totalCalendars?: number;
    processedCalendars?: number;
    currentOperation?: string;
}

export const CALENDAR_SYNCS_QUERY_KEY = ['calendarSyncs'] as const;

const ACTIVE_STATUSES = new Set<SyncStatus>([SyncStatus.SYNCING, SyncStatus.DELETING]);

export const useCalendarSync = () => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const { data: syncs = [], isLoading: isSyncsLoading } = useQuery<CalendarSync[]>({
        queryKey: CALENDAR_SYNCS_QUERY_KEY,
        queryFn: async () => {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch calendar syncs');
            const result = await response.json();
            return result.data || [];
        },
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!Array.isArray(data) || data.length === 0) return false;
            return data.some(s => ACTIVE_STATUSES.has(s.syncStatus)) ? 2000 : false;
        },
        staleTime: 0,
        gcTime: 0,
    });

    const refetchSyncs = useCallback(() =>
        queryClient.invalidateQueries({ queryKey: CALENDAR_SYNCS_QUERY_KEY }),
    [queryClient]);

    const deleteSync = useCallback(async (syncId: string): Promise<{ success: boolean; message?: string }> => {
        setIsLoading(true);

        const oldData = queryClient.getQueryData<CalendarSync[]>(CALENDAR_SYNCS_QUERY_KEY);

        queryClient.setQueryData<CalendarSync[]>(CALENDAR_SYNCS_QUERY_KEY, (old) =>
            old?.map(s => s.id === syncId ? { ...s, syncStatus: SyncStatus.DELETING } : s)
        );

        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync/${syncId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                queryClient.setQueryData(CALENDAR_SYNCS_QUERY_KEY, oldData);
                const data = await response.json();
                return { success: false, message: data.message || 'Error al eliminar la sincronización' };
            }
            await refetchSyncs();
            return { success: true };
        } catch (error) {
            queryClient.setQueryData(CALENDAR_SYNCS_QUERY_KEY, oldData);
            return { success: false, message: error instanceof Error ? error.message : 'Network error' };
        } finally {
            setIsLoading(false);
        }
    }, [queryClient, refetchSyncs]);

    const syncNow = useCallback(async (syncId: string, startingLabel: string): Promise<{ success: boolean; message?: string }> => {
        setIsLoading(true);

        const oldData = queryClient.getQueryData<CalendarSync[]>(CALENDAR_SYNCS_QUERY_KEY);

        queryClient.setQueryData<CalendarSync[]>(CALENDAR_SYNCS_QUERY_KEY, (old) =>
            old?.map(s => s.id === syncId
                ? { ...s, syncStatus: SyncStatus.SYNCING, errorMessage: undefined, totalCalendars: undefined, processedCalendars: undefined, currentOperation: startingLabel }
                : s
            )
        );

        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync/${syncId}/sync-now`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            await refetchSyncs();
            if (!response.ok) return { success: false, message: data.message || 'Error al sincronizar' };
            return { success: true, message: data.message };
        } catch (error) {
            queryClient.setQueryData(CALENDAR_SYNCS_QUERY_KEY, oldData);
            return { success: false, message: error instanceof Error ? error.message : 'Network error' };
        } finally {
            setIsLoading(false);
        }
    }, [queryClient, refetchSyncs]);

    return { syncs, isSyncsLoading, deleteSync, syncNow, isLoading };
};