import { useCallback } from "react";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface AprobarSolicitudResponse {
    success: boolean;
    status: number;
    message: string;
    data?: any;
}

interface ApproveRequestData {
    planifiedHours?: number;
    classroomIds?: string[];
}

export const useAprobarSolicitud = () => {
    const aprobarSolicitud = useCallback(async (
        id: string,
        data?: ApproveRequestData,
        refetch?: () => void
    ): Promise<AprobarSolicitudResponse> => {
        try {
            // Prepare body with optional completed data
            const body: ApproveRequestData = {};
            if (data?.planifiedHours !== undefined) {
                body.planifiedHours = data.planifiedHours;
            }
            if (data?.classroomIds !== undefined && data.classroomIds.length > 0) {
                body.classroomIds = data.classroomIds;
            }

            const response = await fetch(`${VITE_GATEWAY_API_URL}/event-request/${id}/approve`, {
                method: "PATCH",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(body)
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
