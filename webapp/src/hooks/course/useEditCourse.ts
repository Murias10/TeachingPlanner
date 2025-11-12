import { useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface EditCourseFormData {
    courseId: string;
    startYear: number;
    endYear: number;
    state: string;
}

interface EditResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

export const useEditCourse = () => {
    const editCourse = useCallback(async (
        formData: EditCourseFormData,
        refetch: () => void
    ): Promise<EditResult> => {
        try {
            const payload = {
                startYear: formData.startYear,
                endYear: formData.endYear,
                state: formData.state
            };

            const response = await fetch(`${VITE_GATEWAY_API_URL}/course/${formData.courseId}`, {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: responseData.message || 'Error updating course',
                    data: responseData
                };
            }

            // Refetch data after successful update
            refetch();

            return {
                success: true,
                status: response.status,
                data: responseData
            };
        } catch (error) {
            console.error('Error updating course:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }, []);

    return { editCourse };
};
