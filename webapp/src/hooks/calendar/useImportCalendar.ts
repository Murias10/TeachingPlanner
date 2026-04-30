// ============================================
// hooks/calendar/useImportCalendar.ts
// ============================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImportCalendarData, ImportResult } from '@/types/Calendar';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

export const useImportCalendar = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ImportResult, Error, ImportCalendarData>({
        mutationFn: async (data: ImportCalendarData): Promise<ImportResult> => {
            const formData = new FormData();
            formData.append('courseId', data.courseId);
            formData.append('degreeId', data.degreeId);
            formData.append('semester', data.semester.toString());

            data.files.forEach((file) => {
                formData.append('files', file);
            });

            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/import`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                const error: any = new Error(errorData.message || 'Error importing calendar');
                error.errorData = errorData.data;
                throw error;
            }

            const result = await response.json();
            return result.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['courses'] });
            await queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            await queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });

    return {
        importCalendar: mutation.mutate,
        isImporting: mutation.isPending,
        error: mutation.error?.message || null,
        data: mutation.data
    };
};
