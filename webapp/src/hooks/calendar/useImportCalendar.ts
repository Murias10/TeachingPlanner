// ============================================
// hooks/calendar/useImportCalendar.ts
// ============================================
import { useState } from 'react';
import { ImportCalendarData, ImportResult } from '@/types/Calendar';

export const useImportCalendar = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const importCalendar = async (data: ImportCalendarData): Promise<ImportResult> => {
        setIsImporting(true);
        setError(null);

        try {
            // Construir FormData con los datos necesarios
            const formData = new FormData();
            formData.append('courseId', data.courseId);
            formData.append('degreeId', data.degreeId);
            formData.append('semester', data.semester.toString());

            // Agregar cada archivo
            data.files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch(`http://localhost:8080/calendar/import`, {
                method: 'POST',
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