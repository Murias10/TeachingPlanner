import { useMutation, useQueryClient } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { useFloatingAlertContext } from '@/contexts/useFloatingAlertContext';
import { getAuthHeaders } from '@/utils/authHeaders';

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
                throw new Error(errorData.message || 'Error actualizando eventos periódicos personalizados');
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
        onError: (error) => {
            triggerAlert({
                title: 'Error al actualizar eventos',
                description: error.message,
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
