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
    sourceCalendarId?: string; // For calendar duplication
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

export interface ClassroomsValidationResult {
    processed: boolean;
    classroomsCreated: Array<{
        code: string;
        name: string;
        building: string;
    }>;
    classroomsUpdated: Array<{
        code: string;
        name: string;
        building: string;
    }>;
}

export interface CalendarValidationResult {
    calendarCreated: boolean;
    startDate: string;
    endDate: string;
    totalDays: number;
    lectiveDays: number;
    charactersInUse: string;
    daysIgnoredOutOfRange?: number;
    daysAutoFilled?: number;
    ignoredDates?: string[];
    autoFilledDates?: string[];
}

export interface SubjectsValidationResult {
    subjectsCreated: Array<{
        acronym: string;
        name: string;
        totalGroups: number;
    }>;
    errors: Array<{
        row: number;
        acronym: string;
        error: {
            field: string;
            message: string;
        };
    }>;
}

export interface ScheduleValidationResult {
    eventsCreated: number;
    eventsSkipped: number;
    groupsAutoCreated: Array<{
        row: number;
        groupKey: string;
        warning: {
            field: string;
            message: string;
        };
    }>;
    // Errors separated by field type
    subjectErrors: Array<{
        row: number;
        groupKey: string;
        subjectAcronym: string;
        error: {
            field: string;
            message: string;
        };
    }>;
    classroomErrors: Array<{
        row: number;
        groupKey: string;
        classroomCode: string;
        error: {
            field: string;
            message: string;
        };
    }>;
    groupErrors: Array<{
        row: number;
        groupKey: string;
        maxAllowed: number;
        error: {
            field: string;
            message: string;
        };
    }>;
}

export interface ExceptionsValidationResult {
    eventsCreated: number;
    eventsSkipped: number;
    groupsAutoCreated: Array<{
        row: number;
        groupKey: string;
        warning: {
            field: string;
            message: string;
        };
    }>;
    // Errors separated by field type
    subjectErrors: Array<{
        row: number;
        groupKey: string;
        subjectAcronym: string;
        error: {
            field: string;
            message: string;
        };
    }>;
    dateErrors: Array<{
        row: number;
        groupKey: string;
        date: string;
        error: {
            field: string;
            message: string;
        };
    }>;
    groupErrors: Array<{
        row: number;
        groupKey: string;
        error: {
            field: string;
            message: string;
        };
    }>;
    classroomErrors: Array<{
        row: number;
        groupKey: string;
        classroomCode: string;
        error: {
            field: string;
            message: string;
        };
    }>;
}

export interface PINormalizationResult {
    performed: boolean;
    eventsUsePI: boolean;
    iValid: boolean;
    pValid: boolean;
    substitutions: Array<{
        oldCharacter: string;
        newCharacter: string;
        daysUpdated: number;
        periodicEventsUpdated: number;
        puntualEventsUpdated: number;
    }>;
    piAdded: boolean;
    summary: string;
}

export interface GroupValidationResult {
    hasIssues: boolean;
    formatErrors?: Array<{
        row: number;
        line: string;
        reason: 'invalidParts' | 'invalidDate' | 'invalidGroup' | 'invalidTime';
    }>;
    groupsNotFound: Array<{
        row: number;
        groupKey: string;
        subjectAcronym: string;
        groupType: string;
        groupNumber: number;
        language: string;
        maxAllowed: number;
        source: 'horarios' | 'excepciones';
        error: {
            field: string;
            message: string;
        };
    }>;
    groupsAutoCreated: Array<{
        row: number;
        groupKey: string;
        warning: {
            field: string;
            message: string;
        };
    }>;
    statistics: {
        totalRows: number;
        validRows: number;
        groupsNotFoundCount: number;
        groupsAutoCreatedCount: number;
        formatErrorsCount?: number;
        eventsCreated: number;
        eventsSkipped: number;
    };
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
            groupValidation?: GroupValidationResult;
        };
        ubicaciones?: ClassroomsValidationResult;
        calendario?: CalendarValidationResult;
        asignaturas?: SubjectsValidationResult;
        horarios?: ScheduleValidationResult;
        excepciones?: ExceptionsValidationResult;
        piNormalization?: PINormalizationResult;
    };
}