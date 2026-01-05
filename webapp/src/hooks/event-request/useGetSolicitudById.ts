import { useQuery } from "@tanstack/react-query";
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface EventRequest {
    id: string;
    professorId: string;
    calendarId: string;
    eventType: 'PUNTUAL' | 'PERIODIC';
    eventData: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
    createdAt: string;
}

export const useGetSolicitudById = (id: string | null) => {
    return useQuery<EventRequest, Error>({
        queryKey: ["event-request", id],
        queryFn: async () => {
            if (!id) throw new Error("Request ID is required");

            const res = await fetch(`${VITE_GATEWAY_API_URL}/event-request/${id}`, {
                headers: getAuthHeaders()
            });

            if (!res.ok) throw new Error(`Error ${res.status}`);

            const body = await res.json();
            return body.data;
        },
        enabled: !!id,
    });
};
