import { Classroom } from "@/types/Classroom";

export interface Calendar {
    id: string;
    courseId: string;
    semester: number;
    startDate: string;
    endDate: string;
}

export interface CalendarFormData {
    courseId: string;
    semester: number;
    startDate?: Date;
    endDate?: Date;
    files?: File[];
    formData?: FormData;
}

export interface ImportCalendarData {
    courseId: string;
    degreeId: string;
    semester: number;
    files: File[];
}

export interface CalendarDrawerData {
    courseId: string;
    semester: number;
    courseYear: string;
    degreeId: string;
}

export interface ImportResult {
    calendar: Calendar;
    importResult?: {
        classrooms?: {
            processed: boolean;
            totalLines: number;
            processedCount: number;
            errorCount: number;
            classrooms: Array<Classroom>;
            errors: string[];
        };
    };
}