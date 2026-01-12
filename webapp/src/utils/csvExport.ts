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
 * Formatea el grupo en formato Acrónimo.Tipo.Número (ej: AC.T.1 o AC.T.I-1 para inglés)
 */
const formatGroupLabel = (event: CalendarEvent): string => {
    if (!event.groups || event.groups.length === 0) {
        return 'Sin grupo';
    }

    const group = event.groups[0]; // Tomar el primer grupo
    const subject = event.subject;

    if (!subject) {
        return 'Sin asignatura';
    }

    const acronym = subject.acronym;
    const groupType = group.type;
    const groupNumber = group.language === 'EN' ? `I-${group.number}` : `${group.number}`;

    return `${acronym}.${groupType}.${groupNumber}`;
};

/**
 * Formatea el tiempo en formato 24h con punto decimal (ej: 18.00)
 */
const formatTime24h = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}.${minutes}`;
};

/**
 * Genera una descripción simple para el evento
 */
const formatEventDescription = (event: CalendarEvent, eventNumber: number): string => {
    if (event.comment && event.comment.trim()) {
        return event.comment;
    }

    const groupLabel = formatGroupLabel(event);
    return `Hora de clase número ${eventNumber} de ${groupLabel}`;
};

/**
 * Convierte un array de CalendarEvent al formato CSV requerido
 *
 * Formato CSV:
 * Subject, Start Date, Start Time, End Date, End Time, Description, Location
 *
 * Donde:
 * - Subject: Grupo en formato Acrónimo.Tipo.Número (ej: AC.T.1)
 * - Start Date / End Date: DD/MM/YYYY
 * - Start Time / End Time: HH.MM (24h con punto decimal)
 * - Description: Comentario o descripción generada
 * - Location: Código del aula
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
        'Description',
        'Location'
    ];

    const rows = events.map((event, index) => {
        const eventDate = moment(event.date);

        // Validar fecha válida
        if (!eventDate.isValid()) {
            console.warn(`Evento con fecha inválida: ${event.id}`);
            return null;
        }

        // Subject: Grupo en formato Acrónimo.Tipo.Número
        const subject = formatGroupLabel(event);

        // Fecha en formato DD/MM/YYYY
        const startDate = eventDate.format('DD/MM/YYYY');
        const endDate = startDate;

        // Tiempo en formato 24h con punto decimal (HH.MM)
        const startTime = formatTime24h(event.startTime);
        const endTime = formatTime24h(event.endTime);

        // Descripción simple
        const description = formatEventDescription(event, index + 1);

        // Location: Primer aula o vacío
        const location = event.classrooms.length > 0 ? event.classrooms[0].code : '';

        return [
            escapeCSVField(subject),
            escapeCSVField(startDate),
            escapeCSVField(startTime),
            escapeCSVField(endDate),
            escapeCSVField(endTime),
            escapeCSVField(description),
            escapeCSVField(location)
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
