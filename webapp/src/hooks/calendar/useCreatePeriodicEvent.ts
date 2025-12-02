import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { getAuthHeaders } from '@/utils/authHeaders';
import VITE_GATEWAY_API_URL from "@/config/api";

export interface CreatePeriodicEventPayload {
    calendarId: string;
    weekDay: string; // 'L', 'M', 'X', 'J', 'V'
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    planifiedHours: number;
    groupIds?: string[];
    classroomIds?: string[];
}

export interface CreatePeriodicEventResponse {
    status: 'success' | 'error';
    message: string;
    data: null;
}

interface ApiError extends Error {
    statusCode?: number;
}

interface CreatePeriodicEventOptions {
    onSuccess?: (data: CreatePeriodicEventResponse) => void;
    onError?: (error: ApiError) => void;
}

export function useCreatePeriodicEvent() {
    const callbacksRef = useRef<CreatePeriodicEventOptions | undefined>(undefined);

    const mutation = useMutation<CreatePeriodicEventResponse, ApiError, CreatePeriodicEventPayload>({
        mutationFn: async (payload: CreatePeriodicEventPayload) => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/calendar/periodic-event`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
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
        mutate: (payload: CreatePeriodicEventPayload, options?: CreatePeriodicEventOptions) => {
            callbacksRef.current = options;
            mutation.mutate(payload);
        },
    };
}
