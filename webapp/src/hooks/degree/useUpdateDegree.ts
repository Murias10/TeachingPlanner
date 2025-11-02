import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';

// Tipos para mejor type safety
interface UpdateDegreeResponse {
    success: boolean;
    status: number;
    message: string;
    data?: unknown;
}

export const useUpdateDegree = () => {
    const updateDegree = useCallback(async (
        degreeId: string,
        name: string,
        acronym: string,
        refetch?: () => void
    ): Promise<UpdateDegreeResponse> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/degree/${degreeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, acronym })
            });

            // Intentar parsear la respuesta JSON
            let json;
            try {
                json = await response.json();
            } catch {
                // Si no se puede parsear el JSON, crear una respuesta por defecto
                json = {
                    status: 'error',
                    message: `Error ${response.status}: ${response.statusText}`,
                    data: null
                };
            }

            // Si la operación fue exitosa y se pasó refetch, ejecutarlo
            if (response.ok && refetch) {
                refetch();
            }

            // Manejo específico de diferentes códigos de estado
            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    message: json.message || "Titulación actualizada exitosamente",
                    data: json.data,
                };
            } else {
                // Manejo de errores específicos
                let errorMessage = json.message || `Error ${response.status}`;

                switch (response.status) {
                    case 400:
                        errorMessage = json.message || "Datos requeridos faltantes";
                        break;
                    case 404:
                        errorMessage = json.message || "Titulación no encontrada";
                        break;
                    case 409:
                        errorMessage = json.message || "Ya existe una titulación con ese nombre o acrónimo";
                        break;
                    case 500:
                        errorMessage = json.message || "Error interno del servidor";
                        break;
                    default:
                        errorMessage = json.message || `Error ${response.status}: ${response.statusText}`;
                }

                return {
                    success: false,
                    status: response.status,
                    message: errorMessage,
                    data: json.data,
                };
            }
        } catch (error) {
            console.error('Error en updateDegree:', error);

            return {
                success: false,
                status: 500,
                message: error instanceof Error ? `Error de red: ${error.message}` : "Error de conexión",
                data: error,
            };
        }
    }, []);

    return { updateDegree };
}
