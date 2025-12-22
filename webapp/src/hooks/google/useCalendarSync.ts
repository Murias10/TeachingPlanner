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

            await queryClient.invalidateQueries({ queryKey: ['calendarSyncs'] });
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

    // Sincronizar ahora
    const syncNow = useCallback(async (syncId: string, accessToken: string): Promise<{ success: boolean; message?: string }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync/${syncId}/sync-now`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error al sincronizar'
                };
            }

            await queryClient.invalidateQueries({ queryKey: ['calendarSyncs'] });
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Error syncing now:', error);
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
