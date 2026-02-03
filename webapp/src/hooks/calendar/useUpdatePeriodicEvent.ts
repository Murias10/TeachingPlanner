import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { getAuthHeaders } from '@/utils/authHeaders';
import VITE_GATEWAY_API_URL from "@/config/api";

export interface UpdatePeriodicEventPayload {
    eventId: string;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    weekDay?: string; // L, M, X, J, V, S, D
    classroomIds?: string[];
    planifiedHours?: number;
    eventType?: string; // NORMAL | BLOCKER | REVISION_* | EVALUACION_*
}

export interface UpdatePeriodicEventResponse {
    status: 'success' | 'error';
    message: string;
    data: {
        event: any;
    } | null;
}

interface ApiError extends Error {
    statusCode?: number;
}

interface UpdatePeriodicEventOptions {
    onSuccess?: (data: UpdatePeriodicEventResponse) => void;
    onError?: (error: ApiError) => void;
}

export function useUpdatePeriodicEvent() {
    const callbacksRef = useRef<UpdatePeriodicEventOptions | undefined>(undefined);

    const mutation = useMutation<UpdatePeriodicEventResponse, ApiError, UpdatePeriodicEventPayload>({
        mutationFn: async (payload: UpdatePeriodicEventPayload) => {
            const { eventId, ...body } = payload;
            const res = await fetch(`${VITE_GATEWAY_API_URL}/calendar/periodic-event/${eventId}`, {
                method: 'PUT',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(body),
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
        mutate: (payload: UpdatePeriodicEventPayload, options?: UpdatePeriodicEventOptions) => {
            callbacksRef.current = options;
            mutation.mutate(payload);
        },
    };
}
