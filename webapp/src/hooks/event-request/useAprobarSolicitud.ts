import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';
import type { RecurrenceConfig } from '@/types/RecurrenceConfig';
import type { ConflictEntry } from '@/types/conflict.types';

interface AprobarSolicitudResponse {
    success: boolean;
    status: number;
    message: string;
    data?: any;
    conflictData?: ConflictEntry[];
}

export const useAprobarSolicitud = () => {
    const aprobarSolicitud = useCallback(async (
        id: string,
        config: RecurrenceConfig,
        refetch?: () => void
    ): Promise<AprobarSolicitudResponse> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/event-request/${id}/approve`, {
                method: "PATCH",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(config)
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
                    message: json.message || "Solicitud aprobada exitosamente",
                    data: json.data,
                };
            } else {
                return {
                    success: false,
                    status: response.status,
                    message: json.message || "Error al aprobar la solicitud",
                    data: json.data,
                    conflictData: response.status === 409 && json.data?.conflicts
                        ? json.data.conflicts
                        : undefined,
                };
            }
        } catch (error) {
            console.error("Error approving event request:", error);
            return {
                success: false,
                status: 500,
                message: error instanceof Error ? error.message : "Error al aprobar la solicitud",
                data: null,
            };
        }
    }, []);

    return aprobarSolicitud;
};
