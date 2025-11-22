import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface UpdateUserResponse {
    success: boolean;
    status: number;
    message: string;
    data?: unknown;
}

interface UpdateUserData {
    role?: string;
    name?: string;
    firstSurname?: string;
    secondSurname?: string;
}

export const useUpdateUser = () => {
    const updateUser = useCallback(async (
        userId: string,
        userData: UpdateUserData,
        refetch?: () => void
    ): Promise<UpdateUserResponse> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/user/${userId}`, {
                method: "PUT",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(userData)
            });

            let json;
            try {
                json = await response.json();
            } catch {
                json = {
                    status: 'error',
                    message: `Error ${response.status}: ${response.statusText}`,
                    data: null
                };
            }

            if (response.ok && refetch) {
                refetch();
            }

            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    message: json.message || "Usuario actualizado exitosamente",
                    data: json.data,
                };
            } else {
                let errorMessage = json.message || `Error ${response.status}`;

                switch (response.status) {
                    case 400:
                        errorMessage = json.message || "Datos inválidos";
                        break;
                    case 404:
                        errorMessage = json.message || "Usuario no encontrado";
                        break;
                    case 409:
                        errorMessage = json.message || "Email ya en uso";
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
            console.error('Error en updateUser:', error);

            return {
                success: false,
                status: 500,
                message: error instanceof Error ? `Error de red: ${error.message}` : "Error de conexión",
                data: error,
            };
        }
    }, []);

    return { updateUser };
}
