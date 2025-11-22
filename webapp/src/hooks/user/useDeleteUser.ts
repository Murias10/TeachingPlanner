import { useCallback } from "react"
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface DeleteUserResponse {
    success: boolean;
    status: number;
    message: string;
    data?: unknown;
}

export const useDeleteUser = () => {
    const deleteUser = useCallback(async (
        userId: string,
        refetch?: () => void
    ): Promise<DeleteUserResponse> => {
        try {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/user/${userId}`, {
                method: "DELETE",
                headers: getAuthHeaders({ "Content-Type": "application/json" })
            });

            if (!res.ok) {
                let errorMessage = `Error ${res.status}`;
                try {
                    const errorJson = await res.json();
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    errorMessage = `Error ${res.status}: ${res.statusText}`;
                }

                return {
                    success: false,
                    status: res.status,
                    message: errorMessage,
                };
            }

            const json = await res.json();

            if (refetch) {
                refetch();
            }

            return {
                success: true,
                status: res.status,
                message: json.message || "Usuario eliminado correctamente",
                data: json.data,
            };

        } catch (error) {
            console.error('Error al eliminar usuario:', error);

            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error de red",
                data: error,
            };
        }
    }, []);

    return { deleteUser };
}
