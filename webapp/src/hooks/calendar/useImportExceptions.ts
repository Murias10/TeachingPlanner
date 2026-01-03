import { useMutation, useQueryClient } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { useFloatingAlertContext } from '@/contexts/useFloatingAlertContext';

interface ImportExceptionsData {
    calendarId: string;
    file: File;
}

interface ImportExceptionsResult {
    deletedEvents: number;
    createdEvents: number;
    errors: string[];
    groupsNotFound: string[];
    totalLines: number;
    errorCount: number;
}

export const useImportExceptions = () => {
    const queryClient = useQueryClient();
    const { triggerAlert } = useFloatingAlertContext();

    const mutation = useMutation<ImportExceptionsResult, Error, ImportExceptionsData>({
        mutationFn: async (data: ImportExceptionsData): Promise<ImportExceptionsResult> => {
            const formData = new FormData();
            formData.append('file', data.file);

            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/${data.calendarId}/import-exceptions`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error importando excepciones');
            }

            const result = await response.json();
            return result.data;
        },
        onSuccess: async (data) => {
            // Invalidar caches relacionados
            await queryClient.invalidateQueries({
                queryKey: ['calendar-events']
            });

            // Show success alert with statistics
            const hasErrors = data.groupsNotFound.length > 0 || data.errorCount > 0;

            if (hasErrors) {
                const groupsMsg = data.groupsNotFound.length > 0 ? `${data.groupsNotFound.length} grupos no encontrados.` : '';
                const errorsMsg = data.errorCount > 0 ? `${data.errorCount} errores en el formato.` : '';

                triggerAlert({
                    title: 'Excepciones importadas con advertencias',
                    description: `${data.deletedEvents} eventos eliminados, ${data.createdEvents} eventos creados. ${groupsMsg} ${errorsMsg}`,
                    variant: 'warning'
                });
            } else {
                triggerAlert({
                    title: 'Excepciones importadas correctamente',
                    description: `${data.deletedEvents} eventos eliminados, ${data.createdEvents} eventos creados.`,
                    variant: 'success'
                });
            }
        },
        onError: (error) => {
            triggerAlert({
                title: 'Error al importar excepciones',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    return {
        importExceptions: mutation.mutate,
        importExceptionsAsync: mutation.mutateAsync,
        isImporting: mutation.isPending,
        error: mutation.error?.message || null,
        data: mutation.data
    };
};
