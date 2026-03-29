import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';
import type { EventRequest } from '@/types/EventRequest';

interface ListarMisSolicitudesResponse {
    success: boolean;
    status: number;
    message: string;
    data?: {
        requests: EventRequest[];
        count: number;
    } | null;
}

export const useListarMisSolicitudes = () => {
    const listarMisSolicitudes = useCallback(async (
        status?: string
    ): Promise<ListarMisSolicitudesResponse> => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);

            const url = `${VITE_GATEWAY_API_URL}/my-event-requests${params.toString() ? '?' + params.toString() : ''}`;

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
            console.error("Error fetching my event requests:", error);
            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error al obtener las solicitudes",
                data: null,
            };
        }
    }, []);

    return listarMisSolicitudes;
};
