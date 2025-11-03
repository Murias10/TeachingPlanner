import { useMutation } from "@tanstack/react-query";
import VITE_GATEWAY_API_URL from "@/config/api";

export interface CreatePuntualEventPayload {
    calendarId: string;
    eventDate: string; // YYYY-MM-DD format
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    subjectId?: string;
    groupIds?: string[];
    classroomIds?: string[];
}

export interface CreatePuntualEventResponse {
    status: 'success' | 'error';
    message: string;
    data: any;
}

export function useCreatePuntualEvent() {
    return useMutation<CreatePuntualEventResponse, Error, CreatePuntualEventPayload>({
        mutationFn: async (payload: CreatePuntualEventPayload) => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/calendar/puntual-event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Error ${res.status}`);
            }

            return res.json();
        },
    });
}
