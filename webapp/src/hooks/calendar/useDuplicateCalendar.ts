// ============================================
// hooks/calendar/useDuplicateCalendar.ts
// ============================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

export interface DuplicateCalendarData {
    sourceCalendarId: string;
    targetCourseId: string;
    semester: number;
    start: Date;
    end: Date;
    holidays?: Array<{ date: Date; comment: string }>;
}

export interface DuplicateCalendarResponse {
    status: string;
    message: string;
    data: {
        calendar: {
            id: string;
            start: Date;
            end: Date;
            semester: number;
            charactersInUse: string;
        };
        daysCreated: number;
        lectiveDays: number;
        subjectsDuplicated: number;
        groupsDuplicated: number;
        eventsCloned: number;
    };
}

export const useDuplicateCalendar = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<DuplicateCalendarResponse, Error, DuplicateCalendarData>({
        mutationFn: async (data: DuplicateCalendarData): Promise<DuplicateCalendarResponse> => {
            // Función auxiliar para formatear fecha como YYYY-MM-DD sin zona horaria
            // Esto evita problemas cuando la fecha se convierte a UTC y cambia de día
            const formatDateAsLocal = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Format dates using local time to avoid timezone issues
            const formattedData = {
                sourceCalendarId: data.sourceCalendarId,
                targetCourseId: data.targetCourseId,
                semester: data.semester,
                start: formatDateAsLocal(data.start),
                end: formatDateAsLocal(data.end),
                holidays: data.holidays?.map(h => ({
                    date: formatDateAsLocal(h.date),
                    comment: h.comment
                })) || []
            };

            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/duplicate`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error duplicating calendar');
            }

            const result = await response.json();
            return result;
        },
        onSuccess: async () => {
            // Invalidar caches relacionados
            await queryClient.invalidateQueries({
                queryKey: ['courses']
            });
            await queryClient.invalidateQueries({
                queryKey: ['calendar-events']
            });
            await queryClient.invalidateQueries({
                queryKey: ['calendars']
            });
        },
    });

    return {
        duplicateCalendar: mutation.mutate,
        isDuplicating: mutation.isPending,
        error: mutation.error?.message || null,
        data: mutation.data
    };
};
