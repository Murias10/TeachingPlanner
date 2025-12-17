import { useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface DeleteResult {
    success: boolean;
    message?: string;
    status?: number;
}

export const useDeleteGroup = () => {
    const deleteGroup = useCallback(async (
        groupId: string,
        refetch: () => void
    ): Promise<DeleteResult> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/group/${groupId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: responseData.message || 'Error deleting group'
                };
            }

            refetch();

            return {
                success: true,
                status: response.status,
                message: responseData.message
            };
        } catch (error) {
            console.error('Error deleting group:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }, []);

    return { deleteGroup };
};
