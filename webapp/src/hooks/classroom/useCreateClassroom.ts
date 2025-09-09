import { useCallback } from "react";

// Tipos para mejor type safety
interface CreateClassroomResponse {
    success: boolean;
    status: number;
    message: string;
    data?: unknown;
}

export const useCreateClassroom = () => {
    const createClassroom = useCallback(async (
        code: string,
        gisUrl: string,
        refetch?: () => void
    ): Promise<CreateClassroomResponse> => {
        try {
            const response = await fetch("http://localhost:8080/classroom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, gisUrl })
            });

            // Suprimir el log de error automático del navegador para códigos esperados
            if (!response.ok && [400, 409].includes(response.status)) {
                // Estos son errores de validación esperados, no errores de red
                // El navegador los muestra como errores pero son parte del flujo normal
            }

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
                    message: json.message || "Aula creada exitosamente",
                    data: json.data,
                };
            } else {
                // Manejo de errores específicos
                let errorMessage = json.message || `Error ${response.status}`;

                switch (response.status) {
                    case 400:
                        errorMessage = json.message || "Datos requeridos faltantes";
                        break;
                    case 409:
                        // Error de conflicto - código ya existe
                        errorMessage = json.message || "Ya existe un aula con ese código";
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
            console.error('Error en createClassroom:', error);

            return {
                success: false,
                status: 500,
                message: error instanceof Error ? `Error de red: ${error.message}` : "Error de conexión",
                data: error,
            };
        }
    }, []);

    return { createClassroom };
}