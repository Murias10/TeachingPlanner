import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface UpdatePasswordResponse {
    success: boolean;
    status: number;
    message: string;
}

interface UpdatePasswordData {
    currentPassword: string;
    newPassword: string;
}

export const useUpdatePassword = () => {
    const updatePassword = useCallback(async (
        userId: string,
        passwordData: UpdatePasswordData
    ): Promise<UpdatePasswordResponse> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/user/${userId}/password`, {
                method: "PATCH",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(passwordData)
            });

            let json;
            try {
                json = await response.json();
            } catch {
                json = {
                    status: 'error',
                    message: `Error ${response.status}: ${response.statusText}`
                };
            }

            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    message: json.message || "Contraseña actualizada exitosamente"
                };
            } else {
                let errorMessage = json.message || `Error ${response.status}`;

                switch (response.status) {
                    case 400:
                        errorMessage = json.message || "Datos inválidos";
                        break;
                    case 401:
                        errorMessage = json.message || "Contraseña actual incorrecta";
                        break;
                    case 404:
                        errorMessage = json.message || "Usuario no encontrado";
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
                    message: errorMessage
                };
            }
        } catch (error) {
            console.error('Error en updatePassword:', error);

            return {
                success: false,
                status: 500,
                message: error instanceof Error ? `Error de red: ${error.message}` : "Error de conexión"
            };
        }
    }, []);

    return { updatePassword };
}
