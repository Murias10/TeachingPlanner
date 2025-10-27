import { useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';

interface UpdateClassroomFormData {
    classroomId: string;
    code: string;
    gisUrl: string;
}

interface UpdateResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

export const useUpdateClassroom = () => {
    const updateClassroom = useCallback(async (
        formData: UpdateClassroomFormData,
        refetch: () => void
    ): Promise<UpdateResult> => {
        try {
            const payload = {
                code: formData.code,
                gisUrl: formData.gisUrl
            };

            const response = await fetch(`${VITE_GATEWAY_API_URL}/classroom/${formData.classroomId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: responseData.message || 'Error updating classroom',
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
            console.error('Error updating classroom:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }, []);

    return { updateClassroom };
};
