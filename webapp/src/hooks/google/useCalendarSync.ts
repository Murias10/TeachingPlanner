import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

export interface CalendarSync {
    id: string;
    calendarId: string;
    courseName: string;
    semester: string;
    degreeId: string;
    degreeName: string;
    degreeAcronym: string;
    syncEnabled: boolean;
    syncStatus: string;
    lastSyncAt?: string;
    errorMessage?: string;
    totalCalendars?: number;
    processedCalendars?: number;
    currentOperation?: string;
}

export const useCalendarSync = () => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    // Obtener todas las sincronizaciones del usuario (calendarios académicos)
    const { data: syncs = [], isLoading: isSyncsLoading, refetch } = useQuery<CalendarSync[]>({
        queryKey: ['calendarSyncs'],
        queryFn: async () => {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch calendar syncs');
            }

            const result = await response.json();
            return result.data || [];
        },
        enabled: true,
        // Auto-refresh every 2 seconds if any sync is in progress
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data || !Array.isArray(data)) return false;
            const hasSyncing = data.some(sync => sync.syncStatus === 'SYNCING');
            return hasSyncing ? 2000 : false;
        },
        // Keep data fresh
        staleTime: 0,
        gcTime: 0,
    });

    // Activar/desactivar sincronización
    const toggleSync = useCallback(async (syncId: string): Promise<{ success: boolean; message?: string }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync/${syncId}/toggle`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const data = await response.json();
                return {
                    success: false,
                    message: data.message || 'Error al cambiar estado de sincronización'
                };
            }

            // Invalidate and refetch to update UI immediately
            await queryClient.invalidateQueries({ queryKey: ['calendarSyncs'] });
            await queryClient.refetchQueries({ queryKey: ['calendarSyncs'] });

            return { success: true };
        } catch (error) {
            console.error('Error toggling calendar sync:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        } finally {
            setIsLoading(false);
        }
    }, [queryClient]);

    // Sincronizar ahora (el token se obtiene en el backend)
    const syncNow = useCallback(async (syncId: string): Promise<{ success: boolean; message?: string }> => {
        setIsLoading(true);

        // Optimistically update the UI to show SYNCING state immediately
        queryClient.setQueryData<CalendarSync[]>(['calendarSyncs'], (oldData) => {
            if (!oldData) return oldData;
            return oldData.map(sync =>
                sync.id === syncId
                    ? { ...sync, syncStatus: 'SYNCING', errorMessage: undefined, totalCalendars: undefined, processedCalendars: undefined, currentOperation: 'Iniciando sincronización...' }
                    : sync
            );
        });

        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync/${syncId}/sync-now`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                // Revert optimistic update on error
                await queryClient.invalidateQueries({ queryKey: ['calendarSyncs'] });
                await queryClient.refetchQueries({ queryKey: ['calendarSyncs'] });

                return {
                    success: false,
                    message: data.message || 'Error al sincronizar'
                };
            }

            // Refetch to get the actual state from backend
            await queryClient.invalidateQueries({ queryKey: ['calendarSyncs'] });
            await queryClient.refetchQueries({ queryKey: ['calendarSyncs'] });

            return { success: true, message: data.message };
        } catch (error) {
            console.error('Error syncing now:', error);

            // Revert optimistic update on error
            await queryClient.invalidateQueries({ queryKey: ['calendarSyncs'] });
            await queryClient.refetchQueries({ queryKey: ['calendarSyncs'] });

            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        } finally {
            setIsLoading(false);
        }
    }, [queryClient]);

    return {
        syncs,
        isSyncsLoading,
        toggleSync,
        syncNow,
        isLoading,
        refetch
    };
};
