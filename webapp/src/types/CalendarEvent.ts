import { Subject } from '@/types/Subject';
import { Group } from '@/types/Group';
import { Classroom } from '@/types/Classroom';

export interface CalendarEvent {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    subject: Subject | null;
    groups: Group[];
    classrooms: Classroom[];
    type: 'periodic' | 'punctual';
    cancelled: boolean;
    periodicEventId?: string;
    dayCharacter: string;
    dayComment: string;
}

export interface CalendarEventsResponse {
    calendarId: string;
    semester: number;
    startDate: string;
    endDate: string;
    totalEvents: number;
    events: CalendarEvent[];
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T;
}