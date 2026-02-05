import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface CreateSolicitudResponse {
    success: boolean;
    status: number;
    message: string;
    data?: any;
}

export const useCrearSolicitud = () => {
    const crearSolicitud = useCallback(async (
        calendarId: string,
        eventType: string,
        eventData: any,
        refetch?: () => void,
        requestType: string = 'CREATE',
        originalEventId: string | null = null
    ): Promise<CreateSolicitudResponse> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/event-request`, {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ calendarId, eventType, eventData, requestType, originalEventId })
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
                    message: json.message || "Solicitud enviada exitosamente",
                    data: json.data,
                };
            } else {
                return {
                    success: false,
                    status: response.status,
                    message: json.message || "Error al crear la solicitud",
                    data: json.data,
                };
            }
        } catch (error) {
            console.error("Error creating event request:", error);
            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error al crear la solicitud",
                data: null,
            };
        }
    }, []);

    return crearSolicitud;
};
