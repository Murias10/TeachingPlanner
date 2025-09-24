
interface CalendarFormData {
    courseId: string;
    semester: number;
    startDate?: Date;
    endDate?: Date;
    files?: File[];
    formData?: FormData;
}

export const calendarService = {
    // Crear calendario con importación
    async createCalendarWithImport(data: CalendarFormData) {
        if (!data.formData) {
            throw new Error('FormData is required for import');
        }

        const response = await fetch(`$localhost:8080/calendars/import`, {
            method: 'POST',
            body: data.formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error creating calendar with import');
        }

        return await response.json();
    }
}