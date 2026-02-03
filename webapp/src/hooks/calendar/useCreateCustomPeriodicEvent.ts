import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { getAuthHeaders } from '@/utils/authHeaders';
import VITE_GATEWAY_API_URL from "@/config/api";

export interface CreateCustomPeriodicEventPayload {
    calendarId: string;
    affectedDates: string[]; // Array de fechas YYYY-MM-DD
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    planifiedHours: number;
    eventCharacter?: string; // Optional - backend will assign if not provided
    groupIds?: string[];
    classroomIds?: string[];
    eventType?: string; // NORMAL | BLOCKER | REVISION_* | EVALUACION_*
}

export interface CreateCustomPeriodicEventResponse {
    status: 'success' | 'error';
    message: string;
    data: {
        events: Array<{
            id: string;
            weekDay: string;
            startTime: string;
            endTime: string;
            planifiedHours: number;
            eventCharacter: string;
        }>;
        eventCharacter: string;
        affectedDatesCount: number;
        daysUpdated: number;
        weekDays: string[];
    };
}

interface ApiError extends Error {
    statusCode?: number;
}

interface CreateCustomPeriodicEventOptions {
    onSuccess?: (data: CreateCustomPeriodicEventResponse) => void;
    onError?: (error: ApiError) => void;
}

export function useCreateCustomPeriodicEvent() {
    const queryClient = useQueryClient();
    const callbacksRef = useRef<CreateCustomPeriodicEventOptions | undefined>(undefined);

    const mutation = useMutation<CreateCustomPeriodicEventResponse, ApiError, CreateCustomPeriodicEventPayload>({
        mutationFn: async (payload: CreateCustomPeriodicEventPayload) => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/calendar/custom-periodic-event`, {
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
        onSuccess: (data, variables) => {
            // Invalidar cache del calendario para actualizar charactersInUse
            queryClient.invalidateQueries({
                queryKey: ['calendar', variables.calendarId]
            });

            // Invalidar eventos del calendario
            queryClient.invalidateQueries({
                queryKey: ['calendar-events']
            });

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
        mutate: (payload: CreateCustomPeriodicEventPayload, options?: CreateCustomPeriodicEventOptions) => {
            callbacksRef.current = options;
            mutation.mutate(payload);
        },
    };
}
