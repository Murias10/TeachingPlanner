import moment from 'moment';
import { CalendarEvent } from '@/types/CalendarEvent';

/**
 * Escapa caracteres especiales en campos CSV según RFC 4180
 */
const escapeCSVField = (field: string | number | boolean): string => {
    const stringField = String(field);

    // Siempre usar comillas si contiene caracteres especiales
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }

    return stringField;
};

/**
 * Formatea un evento como descripción para el CSV
 */
const formatEventDescription = (event: CalendarEvent): string => {
    const parts: string[] = [];

    if (event.groups.length > 0) {
        const groupsInfo = event.groups
            .map(g => `${g.type} (${g.language})`)
            .join(', ');
        parts.push(`Grupos: ${groupsInfo}`);
    }

    if (event.comment) {
        parts.push(`Comentario: ${event.comment}`);
    }

    if (event.dayComment) {
        parts.push(`Día: ${event.dayComment}`);
    }

    if (event.dayCharacter) {
        parts.push(`Carácter: ${event.dayCharacter}`);
    }

    return parts.join(' | ');
};

/**
 * Convierte un array de CalendarEvent al formato CSV de Google Calendar
 *
 * Formato de Google Calendar CSV:
 * Subject, Start Date, Start Time, End Date, End Time, All Day Event, Description, Location, Private
 */
export const generateGoogleCalendarCSV = (events: CalendarEvent[]): string => {
    if (!events || events.length === 0) {
        throw new Error('No hay eventos para exportar');
    }

    const headers = [
        'Subject',
        'Start Date',
        'Start Time',
        'End Date',
        'End Time',
        'All Day Event',
        'Description',
        'Location',
        'Private'
    ];

    const rows = events.map(event => {
        const eventDate = moment(event.date);

        // Validar fecha válida
        if (!eventDate.isValid()) {
            console.warn(`Evento con fecha inválida: ${event.id}`);
            return null;
        }

        const subject = event.subject?.name || 'Sin asignatura';
        const startDate = eventDate.format('MM/DD/YYYY');
        const endDate = startDate;

        // Calcular end time basado en startTime + duration
        const startMoment = moment(event.startTime, 'HH:mm');
        const endMoment = moment(event.endTime, 'HH:mm');

        // Formato de 12 horas con AM/PM
        const startTime = startMoment.format('h:mm A');
        const endTime = endMoment.format('h:mm A');

        const description = formatEventDescription(event);
        const location = event.classrooms.map(c => c.code).join(', ') || '';

        return [
            escapeCSVField(subject),
            escapeCSVField(startDate),
            escapeCSVField(startTime),
            escapeCSVField(endDate),
            escapeCSVField(endTime),
            'False',
            escapeCSVField(description),
            escapeCSVField(location),
            'False'
        ].join(',');
    }).filter(Boolean); // Filtrar eventos con errores

    return [headers.join(','), ...rows].join('\n');
};

/**
 * Descarga un string CSV como archivo
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
    // Añadir BOM para UTF-8 (necesario para caracteres especiales en Excel/Google Calendar)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Crear enlace de descarga
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar el objeto URL
    URL.revokeObjectURL(url);
};
