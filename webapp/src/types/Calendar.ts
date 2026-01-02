import { Classroom } from "@/types/Classroom";

export interface Calendar {
    id: string;
    courseId: string;
    semester: number;
    startDate: string;
    endDate: string;
    charactersInUse?: string;
}

export interface HolidayWithComment {
    date: Date;
    comment: string;
}

export interface CalendarFormData {
    courseId: string;
    semester: number;
    startDate?: Date;
    endDate?: Date;
    holidays?: HolidayWithComment[];
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

export interface PIConflictDetection {
    detected: boolean;
    type: 'none' | 'P_only' | 'I_only' | 'both_PI' | 'irregular';
    summary: string;
    details: Array<{
        character: 'P' | 'I';
        expectedCharacter: 'P' | 'I' | 'F';
        affectedDays: Array<{
            date: Date;
            actualCharacter: string;
            expectedCharacter: string;
            weekNumber: number;
        }>;
    }>;
    statistics: {
        totalDays: number;
        lectiveDays: number;
        daysWithP: number;
        daysWithI: number;
        expectedPDays: number;
        expectedIDays: number;
        conflictingDays: number;
    };
}

export interface PISubstitution {
    performed: boolean;
    substitutions: Array<{
        oldCharacter: string;
        newCharacter: string;
        reason: string;
        daysUpdated: number;
        eventsUpdated: number;
    }>;
    updatedCharactersInUse: string;
    summary: string;
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
        events?: {
            processed: boolean;
            totalLines: number;
            processedCount: number;
            errorCount: number;
            errors: string[];
            piConflictDetection?: PIConflictDetection;
            piSubstitution?: PISubstitution;
        };
    };
}