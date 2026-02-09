import { useCallback } from "react"
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

// Tipos para mejor type safety
interface DeleteResponse {
    success: boolean;
    status: number;
    message: string;
    data?: unknown;
}

export const useDeleteClassroom = () => {
    const deleteClassroom = useCallback(async (
        classroomId: string,
        refetch?: () => void,
        force?: boolean
    ): Promise<DeleteResponse> => {
        try {
            const url = force
                ? `${VITE_GATEWAY_API_URL}/classroom/${classroomId}?force=true`
                : `${VITE_GATEWAY_API_URL}/classroom/${classroomId}`;

            const res = await fetch(url, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            // Verificar si la respuesta es válida antes de parsear JSON
            if (!res.ok) {
                // Intentar obtener el mensaje de error del servidor
                let errorMessage = `Error ${res.status}`;
                let errorData = undefined;
                try {
                    const errorJson = await res.json();
                    errorMessage = errorJson.message || errorMessage;
                    errorData = errorJson.data; // Capturar el data para errores 409
                } catch {
                    // Si no se puede parsear el JSON de error, usar mensaje genérico
                    errorMessage = `Error ${res.status}: ${res.statusText}`;
                }

                return {
                    success: false,
                    status: res.status,
                    message: errorMessage,
                    data: errorData, // Incluir el data en la respuesta de error
                };
            }

            // Parsear respuesta exitosa
            const json = await res.json();

            // Si la operación fue exitosa y se pasó refetch, ejecutarlo
            if (refetch) {
                refetch();
            }

            return {
                success: true,
                status: res.status,
                message: json.message || "Eliminado correctamente",
                data: json.data,
            };

        } catch (error) {
            console.error('Error al eliminar classroom:', error);

            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error de red",
                data: error,
            };
        }
    }, []);

    return { deleteClassroom };
}
