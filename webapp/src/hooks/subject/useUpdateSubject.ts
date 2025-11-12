import { useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface UpdateSubjectFormData {
    subjectId: string;
    acronym: string;
    year: number;
    name: string;
    siesCode: string;
    semester: number;
}

interface UpdateResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

export const useUpdateSubject = () => {
    const updateSubject = useCallback(async (
        formData: UpdateSubjectFormData,
        refetch: () => void
    ): Promise<UpdateResult> => {
        try {
            const payload = {
                acronym: formData.acronym,
                year: formData.year,
                name: formData.name,
                siesCode: formData.siesCode,
                semester: formData.semester
            };

            const response = await fetch(`${VITE_GATEWAY_API_URL}/subject/${formData.subjectId}`, {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: responseData.message || 'Error updating subject',
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
            console.error('Error updating subject:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }, []);

    return { updateSubject };
};
