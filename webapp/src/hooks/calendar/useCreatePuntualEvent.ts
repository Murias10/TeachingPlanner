import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
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
    data: null;
}

interface ApiError extends Error {
    statusCode?: number;
}

interface CreatePuntualEventOptions {
    onSuccess?: (data: CreatePuntualEventResponse) => void;
    onError?: (error: ApiError) => void;
}

export function useCreatePuntualEvent() {
    const callbacksRef = useRef<CreatePuntualEventOptions | undefined>(undefined);

    const mutation = useMutation<CreatePuntualEventResponse, ApiError, CreatePuntualEventPayload>({
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
        mutate: (payload: CreatePuntualEventPayload, options?: CreatePuntualEventOptions) => {
            callbacksRef.current = options;
            mutation.mutate(payload);
        },
    };
}
