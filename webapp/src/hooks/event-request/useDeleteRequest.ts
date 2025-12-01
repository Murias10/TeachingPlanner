import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface DeleteRequestResponse {
    success: boolean;
    status: number;
    message: string;
    data?: unknown;
}

export const useDeleteRequest = () => {
    const deleteRequest = useCallback(async (
        id: string,
        refetch?: () => void | Promise<unknown>
    ): Promise<DeleteRequestResponse> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/event-request/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders({ "Content-Type": "application/json" })
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
                await Promise.resolve(refetch());
            }

            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    message: json.message || "Solicitud eliminada exitosamente",
                    data: json.data,
                };
            } else {
                return {
                    success: false,
                    status: response.status,
                    message: json.message || "Error al eliminar la solicitud",
                    data: json.data,
                };
            }
        } catch (error) {
            console.error("Error deleting event request:", error);
            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error al eliminar la solicitud",
                data: null,
            };
        }
    }, []);

    return deleteRequest;
};
