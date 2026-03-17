import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';
import { useFloatingAlertContext } from '@/contexts/useFloatingAlertContext';
import { GroupValidationResult } from '@/types/Calendar';

interface ImportExceptionsData {
    calendarId: string;
    file: File;
    mode: 'add' | 'replace';
}

interface ImportExceptionsResult {
    deletedEvents: number;
    createdEvents: number;
    errors: string[];
    totalLines: number;
    errorCount: number;
    groupValidation: GroupValidationResult;
}

interface UseImportExceptionsOptions {
    onValidationIssues?: (data: GroupValidationResult) => void;
    onSuccess?: () => void;
}

export const useImportExceptions = (options?: UseImportExceptionsOptions) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { triggerAlert } = useFloatingAlertContext();

    const mutation = useMutation<ImportExceptionsResult, Error, ImportExceptionsData>({
        mutationFn: async (data: ImportExceptionsData): Promise<ImportExceptionsResult> => {
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('mode', data.mode);

            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/${data.calendarId}/import-exceptions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error importando excepciones');
            }

            const result = await response.json();
            return result.data;
        },
        onSuccess: async (data, variables) => {
            // Invalidar caches relacionados
            await queryClient.invalidateQueries({
                queryKey: ['calendar-events']
            });

            // Check if there are validation issues
            if (data.groupValidation?.hasIssues && options?.onValidationIssues) {
                // Call callback to show validation dialog
                options.onValidationIssues(data.groupValidation);
            } else {

                // Show success alert only if no validation issues
                const description = variables.mode === 'replace'
                    ? t('calendar.alerts.importExceptions.success.replace', {
                        deleted: data.deletedEvents,
                        created: data.createdEvents
                    })
                    : t('calendar.alerts.importExceptions.success.add', {
                        created: data.createdEvents
                    });

                triggerAlert({
                    title: t('calendar.alerts.importExceptions.success.title'),
                    description,
                    variant: 'success'
                });

                // Call success callback if provided
                options?.onSuccess?.();
            }
        },
        onError: (error) => {
            triggerAlert({
                title: t('calendar.alerts.importExceptions.error.title'),
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
