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
    type: 'periodic' | 'puntual';
    cancelled: boolean;
    periodicEventId?: string; // ID del evento periódico original (si type === 'periodic')
    puntualEventId?: string; // ID del evento puntual original (si type === 'puntual')
    eventCharacter?: string; // Carácter del evento periódico (N = Normal, etc.)
    weekDay?: string; // Día de la semana del evento periódico (Monday, Tuesday, etc.)
    dayCharacter: string;
    dayComment: string;
    comment?: string;
    isBlocker?: boolean; // Indica si es un evento blocker (ocupa aula sin asignatura/grupo)
    isPending?: boolean; // Indica si es un evento de una solicitud pendiente
    requestId?: string; // ID de la solicitud original (si isPending === true)
    professorId?: string; // Email del professor que solicitó el evento (si isPending === true)
}

export interface CalendarEventsResponse {
    calendarId: string;
    semester: number;
    startDate: string;
    endDate: string;
    totalEvents: number;
    events: CalendarEvent[];
    lectiveDates: string[]; // Array de fechas en formato YYYY-MM-DD que SÍ son lectivas
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T;
}