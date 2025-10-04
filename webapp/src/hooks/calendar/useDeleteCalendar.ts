// hooks/calendar/useDeleteCalendar.ts
import { useState } from 'react';
import VITE_GATEWAY_API_URL from "@/config/api"

interface DeleteCalendarResult {
    success: boolean;
    message?: string;
    status?: number;
}

export const useDeleteCalendar = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteCalendar = async (
        calendarId: string,
        refetchCallback?: () => void
    ): Promise<DeleteCalendarResult> => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/${calendarId}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                let errorMessage = 'Error deleting calendar';

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Si no se puede parsear la respuesta, usar mensaje por defecto
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                return {
                    success: false,
                    message: errorMessage,
                    status: response.status
                };
            }

            // Ejecutar callback de refetch si se proporciona
            if (refetchCallback) {
                refetchCallback();
            }

            return {
                success: true,
                status: response.status
            };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network error deleting calendar';
            setError(errorMessage);

            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        deleteCalendar,
        isDeleting,
        error
    };
};