import { useMutation, useQueryClient } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { useFloatingAlertContext } from '@/contexts/useFloatingAlertContext';
import { getAuthHeaders } from '@/utils/authHeaders';
import { useTranslation } from 'react-i18next';
import type { ApiError } from '@/types/conflict.types';
import { buildConflictDescription } from '@/utils/conflict.utils';

interface UpdateCustomPeriodicEventData {
    eventCharacter: string;
    calendarId: string;
    startTime: string;
    endTime: string;
    classroomIds?: string[];
    planifiedHours?: number;
    eventType?: string; // NORMAL | BLOCKER | REVISION_* | EVALUACION_*
}

interface UpdateCustomPeriodicEventResult {
    updatedCount: number;
    eventCharacter: string;
}

export const useUpdateCustomPeriodicEvent = () => {
    const queryClient = useQueryClient();
    const { triggerAlert } = useFloatingAlertContext();
    const { t } = useTranslation();

    const mutation = useMutation<UpdateCustomPeriodicEventResult, ApiError, UpdateCustomPeriodicEventData>({
        mutationFn: async (data: UpdateCustomPeriodicEventData): Promise<UpdateCustomPeriodicEventResult> => {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/custom-periodic-event`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                const error = new Error(errorData.message || 'Error actualizando eventos periódicos personalizados') as ApiError;
                error.statusCode = response.status;
                if (response.status === 409 && errorData.data?.conflicts) {
                    error.conflictData = errorData.data.conflicts;
                }
                throw error;
            }

            const result = await response.json();
            return result.data;
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({
                queryKey: ['calendar-events']
            });

            triggerAlert({
                title: 'Eventos actualizados correctamente',
                description: `Se actualizaron ${data.updatedCount} eventos con carácter '${data.eventCharacter}'.`,
                variant: 'success'
            });
        },
        onError: (error: ApiError) => {
            const description = buildConflictDescription(
                error.conflictData?.[0],
                {
                    both: 'calendar.alerts.customPeriodicEvent.updateError.conflictBoth',
                    group: 'calendar.alerts.customPeriodicEvent.updateError.conflictGroup',
                    classroom: 'calendar.alerts.customPeriodicEvent.updateError.conflictClassroom',
                },
                {},
                t
            ) ?? error.message;

            triggerAlert({
                title: t('calendar.alerts.customPeriodicEvent.updateError.title'),
                description,
                variant: 'destructive'
            });
        }
    });

    return {
        updateCustomPeriodicEvent: mutation.mutate,
        updateCustomPeriodicEventAsync: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error?.message || null,
        data: mutation.data
    };
};
