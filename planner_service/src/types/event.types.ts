export interface Event {
    id: string;
    date: string; // ISO format
    startTime: string;
    endTime: string;
    duration: number; // en horas
    subject: {
        id: string;
        acronym: string;
        name: string;
    };
    groups: Array<{
        id: string;
        number: number;
        type: string;
        language: string;
    }>;
    classrooms: Array<{
        id: string;
        code: string;
        gisUrl: string;
    }>;
    type: 'periodic' | 'puntual';
    cancelled: boolean;
    periodicEventId?: string; // ID del evento periódico original (si type === 'periodic')
    puntualEventId?: string; // ID del evento puntual original (si type === 'puntual')
    comment?: string;
}