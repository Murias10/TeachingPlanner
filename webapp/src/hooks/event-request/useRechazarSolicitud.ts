import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface RechazarSolicitudResponse {
    success: boolean;
    status: number;
    message: string;
    data?: any;
}

export const useRechazarSolicitud = () => {
    const rechazarSolicitud = useCallback(async (
        id: string,
        comments: string,
        refetch?: () => void
    ): Promise<RechazarSolicitudResponse> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/event-request/${id}/reject`, {
                method: "PATCH",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ comments })
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
                    message: json.message || "Solicitud rechazada exitosamente",
                    data: json.data,
                };
            } else {
                return {
                    success: false,
                    status: response.status,
                    message: json.message || "Error al rechazar la solicitud",
                    data: json.data,
                };
            }
        } catch (error) {
            console.error("Error rejecting event request:", error);
            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error al rechazar la solicitud",
                data: null,
            };
        }
    }, []);

    return rechazarSolicitud;
};
