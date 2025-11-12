// hooks/calendar/useDeletePuntualEvent.ts
import { useState } from 'react';
import { getAuthHeaders } from '@/utils/authHeaders';
import VITE_GATEWAY_API_URL from "@/config/api"

interface DeletePuntualEventResult {
    success: boolean;
    message?: string;
    status?: number;
}

export const useDeletePuntualEvent = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deletePuntualEvent = async (
        eventId: string,
        refetchCallback?: () => void
    ): Promise<DeletePuntualEventResult> => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/puntual-event/${eventId}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                let errorMessage = 'Error deleting puntual event';

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
            const errorMessage = err instanceof Error ? err.message : 'Network error deleting puntual event';
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
        deletePuntualEvent,
        isDeleting,
        error
    };
};
