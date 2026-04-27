// Tipos para los objetos retornados por CalendarEventsService.generateCalendarEvents().
// Este fichero no importa nada del proyecto para evitar dependencias circulares.

export interface GeneratedEventGroup {
    id: string;
    number: number;
    type: string;
    language: string;
    planifiedHours?: number;
    subject: { acronym: string } | null;
}

export interface GeneratedEventClassroom {
    id: string;
    code: string;
    gisUrl: string;
}

export interface GeneratedCalendarEvent {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    subject: { id: string; acronym: string; name: string; siesCode: string } | null;
    groups: GeneratedEventGroup[];
    classrooms: GeneratedEventClassroom[];
    type: 'puntual' | 'periodic';
    cancelled: boolean;
    eventType: string;
    puntualEventId?: string;
    periodicEventId?: string;
    eventCharacter?: string;
    weekDay?: string;
    dayCharacter: string;
    dayComment: string;
    comment?: string;
}