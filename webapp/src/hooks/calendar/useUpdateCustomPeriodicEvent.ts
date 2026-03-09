import { useMutation, useQueryClient } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { useFloatingAlertContext } from '@/contexts/useFloatingAlertContext';
import { getAuthHeaders } from '@/utils/authHeaders';
import { useTranslation } from 'react-i18next';

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

    const mutation = useMutation<UpdateCustomPeriodicEventResult, Error, UpdateCustomPeriodicEventData>({
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
                const error: Error & { statusCode?: number; conflictData?: { groupNames: string[]; classroomNames: string[] }[] } =
                    new Error(errorData.message || 'Error actualizando eventos periódicos personalizados');
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
            // Invalidar caches relacionados
            await queryClient.invalidateQueries({
                queryKey: ['calendar-events']
            });

            triggerAlert({
                title: 'Eventos actualizados correctamente',
                description: `Se actualizaron ${data.updatedCount} eventos con carácter '${data.eventCharacter}'.`,
                variant: 'success'
            });
        },
        onError: (error: Error & { statusCode?: number; conflictData?: { groupNames: string[]; classroomNames: string[] }[] }) => {
            const first = error.conflictData?.[0];
            let description: string;
            if (error.statusCode === 409 && first) {
                const groupNames = first.groupNames?.join(', ') || '';
                const classroomNames = first.classroomNames?.join(', ') || '';
                if (groupNames && classroomNames) {
                    description = t('alerts.puntualEvent.error.shared_both_detail', { groupNames, classroomNames });
                } else if (groupNames) {
                    description = t('alerts.puntualEvent.error.shared_group_detail', { names: groupNames });
                } else {
                    description = t('alerts.puntualEvent.error.shared_classroom_detail', { names: classroomNames });
                }
            } else {
                description = error.message;
            }
            triggerAlert({
                title: 'Error al actualizar eventos',
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
