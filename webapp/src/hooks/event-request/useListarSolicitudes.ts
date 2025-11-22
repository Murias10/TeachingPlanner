import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface ListarSolicitudesResponse {
    success: boolean;
    status: number;
    message: string;
    data?: {
        requests: any[];
        count: number;
    } | null;
}

export const useListarSolicitudes = () => {
    const listarSolicitudes = useCallback(async (
        status?: string,
        calendarId?: string
    ): Promise<ListarSolicitudesResponse> => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (calendarId) params.append('calendarId', calendarId);

            const url = `${VITE_GATEWAY_API_URL}/event-requests${params.toString() ? '?' + params.toString() : ''}`;

            const response = await fetch(url, {
                method: "GET",
                headers: getAuthHeaders()
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

            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    message: json.message || "Solicitudes obtenidas exitosamente",
                    data: json.data,
                };
            } else {
                return {
                    success: false,
                    status: response.status,
                    message: json.message || "Error al obtener las solicitudes",
                    data: null,
                };
            }
        } catch (error) {
            console.error("Error fetching event requests:", error);
            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error al obtener las solicitudes",
                data: null,
            };
        }
    }, []);

    return listarSolicitudes;
};
