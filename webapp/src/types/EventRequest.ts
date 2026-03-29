export interface EventRequest {
    id: string;
    professorId: string;
    calendarId: string;
    eventType: 'PUNTUAL' | 'PERIODIC';
    requestType?: 'CREATE' | 'EDIT' | 'CANCEL' | 'REPLACE';
    eventData: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
    createdAt: string;
    degreeAcronym?: string | null;
    degreeName?: string | null;
    courseStartYear?: number | null;
    courseEndYear?: number | null;
    semester?: number | null;
}
