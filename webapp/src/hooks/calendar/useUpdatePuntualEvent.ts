import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { getAuthHeaders } from '@/utils/authHeaders';
import VITE_GATEWAY_API_URL from "@/config/api";

export interface UpdatePuntualEventPayload {
    eventId: string;
    eventDate: string; // YYYY-MM-DD format
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    subjectId?: string;
    groupIds?: string[];
    classroomIds?: string[];
    comment: string;
}

export interface UpdatePuntualEventResponse {
    status: 'success' | 'error';
    message: string;
    data: null;
}

interface ApiError extends Error {
    statusCode?: number;
}

interface UpdatePuntualEventOptions {
    onSuccess?: (data: UpdatePuntualEventResponse) => void;
    onError?: (error: ApiError) => void;
}

export function useUpdatePuntualEvent() {
    const callbacksRef = useRef<UpdatePuntualEventOptions | undefined>(undefined);

    const mutation = useMutation<UpdatePuntualEventResponse, ApiError, UpdatePuntualEventPayload>({
        mutationFn: async (payload: UpdatePuntualEventPayload) => {
            const { eventId, ...updateData } = payload;
            const res = await fetch(`${VITE_GATEWAY_API_URL}/calendar/puntual-event/${eventId}`, {
                method: 'PUT',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(updateData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                const error = new Error(errorData.message || `Error ${res.status}`) as ApiError;
                error.statusCode = res.status;
                throw error;
            }

            return res.json();
        },
        onSuccess: (data) => {
            if (callbacksRef.current?.onSuccess) {
                callbacksRef.current.onSuccess(data);
            }
        },
        onError: (error) => {
            if (callbacksRef.current?.onError) {
                callbacksRef.current.onError(error);
            }
        }
    });

    return {
        ...mutation,
        mutate: (payload: UpdatePuntualEventPayload, options?: UpdatePuntualEventOptions) => {
            callbacksRef.current = options;
            mutation.mutate(payload);
        },
    };
}
