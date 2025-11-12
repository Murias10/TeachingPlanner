import { useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface CourseFormData {
    startYear: string;
    endYear: string;
    state: string;
}

interface CreateResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

export const useCreateCourse = () => {
    const createCourse = useCallback(async (
        formData: CourseFormData,
        degreeId: string | null,
        refetch: () => void
    ): Promise<CreateResult> => {
        try {
            const payload = {
                ...formData,
                degree: {
                    id: degreeId
                }
            };

            const response = await fetch(`${VITE_GATEWAY_API_URL}/course`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: responseData.message || 'Error creating course',
                    data: responseData
                };
            }

            // Refetch data after successful creation
            refetch();

            return {
                success: true,
                status: response.status,
                data: responseData
            };
        } catch (error) {
            console.error('Error creating course:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }, []);

    return { createCourse };
};
