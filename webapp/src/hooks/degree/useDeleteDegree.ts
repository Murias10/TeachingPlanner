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

export const useDeleteDegree = () => {
    const deleteDegree = useCallback(async (
        degreeId: string,
        refetch?: () => void
    ): Promise<DeleteResponse> => {
        try {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/degree/${degreeId}`, {
                method: "DELETE",
                headers: getAuthHeaders({ "Content-Type": "application/json" })
            });

            // Verificar si la respuesta es válida antes de parsear JSON
            if (!res.ok) {
                // Intentar obtener el mensaje de error del servidor
                let errorMessage = `Error ${res.status}`;
                try {
                    const errorJson = await res.json();
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    // Si no se puede parsear el JSON de error, usar mensaje genérico
                    errorMessage = `Error ${res.status}: ${res.statusText}`;
                }

                return {
                    success: false,
                    status: res.status,
                    message: errorMessage,
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
            console.error('Error al eliminar degree:', error);

            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error de red",
                data: error,
            };
        }
    }, []);

    return { deleteDegree };
}