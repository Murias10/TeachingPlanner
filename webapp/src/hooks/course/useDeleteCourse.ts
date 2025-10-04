import { useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';

interface DeleteResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

export const useDeleteCourse = () => {
    const deleteCourse = useCallback(async (
        courseId: string,
        refetch: () => void
    ): Promise<DeleteResult> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/course/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    status: response.status,
                    message: errorData.message || 'Error deleting course',
                    data: errorData
                };
            }

            // Refetch data after successful deletion
            refetch();

            return {
                success: true,
                status: response.status
            };
        } catch (error) {
            console.error('Error deleting course:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }, []);

    return { deleteCourse };
};
