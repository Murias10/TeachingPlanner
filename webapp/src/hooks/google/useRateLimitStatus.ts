import { useQuery } from '@tanstack/react-query';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';
import { CalendarSync } from './useCalendarSync';

export interface RateLimitStatus {
    minute: {
        used: number;
        limit: number;
        windowResetInMs: number;
    };
    daily: {
        used: number;
        estimatedLimit: number;
        resetInMs: number;
    };
    calendarsCreatedToday: {
        used: number;
        estimatedLimit: number;
    };
}

export const useRateLimitStatus = (syncs: CalendarSync[]) => {
    const isSyncing = syncs.some(s => s.syncStatus === 'SYNCING');

    const { data } = useQuery<RateLimitStatus | null>({
        queryKey: ['rateLimitStatus', isSyncing],
        queryFn: async () => {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync/rate-limit-status`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                console.warn('[RateLimit] response not ok:', response.status);
                return null;
            }

            const result = await response.json();
            return result.success ? result.data : null;
        },
        refetchInterval: isSyncing ? 3000 : 30000,
        staleTime: 0,
    });

    return { rateLimitStatus: data ?? null };
};
