// ============================================
// hooks/calendar/useImportCalendar.ts
// ============================================
import { useState } from 'react';
import { ImportCalendarData, ImportResult } from '@/types/Calendar';
import VITE_GATEWAY_API_URL from '@/config/api';

export const useImportCalendar = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const importCalendar = async (data: ImportCalendarData): Promise<ImportResult> => {
        setIsImporting(true);
        setError(null);

        try {
            console.log('=== DEBUG INFO ===');
            console.log('courseId:', data.courseId);
            console.log('degreeId:', data.degreeId);
            console.log('semester:', data.semester);
            console.log('files:', data.files);
            console.log('files length:', data.files.length);
            console.log('first file type:', data.files[0]?.constructor.name);
            console.log('first file instanceof File:', data.files[0] instanceof File);

            const formData = new FormData();
            formData.append('courseId', data.courseId);
            formData.append('degreeId', data.degreeId);
            formData.append('semester', data.semester.toString());

            data.files.forEach((file, index) => {
                console.log(`File ${index}:`, file.name, file.type, file.size);
                formData.append('files', file);
            });

            // Debug: Ver contenido del FormData
            console.log('FormData entries:');
            for (const [key, value] of formData.entries()) {
                console.log(key, value);
            }

            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/import`, {
                method: 'POST',
                // ❌ NO incluir headers aquí
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error importing calendar');
            }

            const result = await response.json();
            return result.data;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown import error';
            setError(errorMessage);
            throw err;
        } finally {
            setIsImporting(false);
        }
    };

    return {
        importCalendar,
        isImporting,
        error
    };
};