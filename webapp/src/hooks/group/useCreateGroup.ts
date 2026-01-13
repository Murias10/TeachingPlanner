import { useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface CreateGroupFormData {
    calendarId: string;
    subjectId: string;
    number: number;
    type: string;
    language: string;
}

interface CreateResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

export const useCreateGroup = () => {
    const createGroup = useCallback(async (
        formData: CreateGroupFormData,
        refetch: () => void
    ): Promise<CreateResult> => {
        try {
            const payload = {
                calendarId: formData.calendarId,
                subjectId: formData.subjectId,
                number: formData.number,
                type: formData.type,
                language: formData.language
            };

            const response = await fetch(`${VITE_GATEWAY_API_URL}/group`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: responseData.message || 'Error creating group',
                    data: responseData
                };
            }

            refetch();

            return {
                success: true,
                status: response.status,
                data: responseData
            };
        } catch (error) {
            console.error('Error creating group:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }, []);

    return { createGroup };
};
