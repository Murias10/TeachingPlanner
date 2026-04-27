import { AppDataSource } from '@/config/data-source';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { CalendarEventsService } from '@/services/calendar-events.service';
import { EVENT_TYPES } from '@/constants/event-characters.constants';
import { In } from 'typeorm';

import type { GeneratedCalendarEvent } from '@/types/generated-calendar-event.types';
export type { GeneratedCalendarEvent, GeneratedEventGroup, GeneratedEventClassroom } from '@/types/generated-calendar-event.types';

// ---------------------------------------------------------------------------
// ConflictEntry — estructura devuelta al cliente en las respuestas 409
// ---------------------------------------------------------------------------

export interface ConflictEntry {
    id: string;
    startTime: string;
    endTime: string;
    type: 'puntual' | 'periodic';
    groupNames: string[];
    classroomNames: string[];
    date?: string;
}

export class ConflictError extends Error {
    readonly conflicts: ConflictEntry[];
    constructor(message: string, conflicts: ConflictEntry[]) {
        super(message);
        this.name = 'ConflictError';
        this.conflicts = conflicts;
    }
}

// ---------------------------------------------------------------------------
// Helpers de detección
// ---------------------------------------------------------------------------

/**
 * Returns PeriodicEvent entities that materialize on a specific date.
 * Uses generateCalendarEvents as the single source of truth.
 */
export async function getActivePeriodicEventsForDay(
    calendarId: string,
    _dayId: string,
    eventDate: Date,
    _dayCharacter: string
): Promise<PeriodicEvent[]> {
    const allEvents = await CalendarEventsService.generateCalendarEvents(calendarId);

    const targetDateStr = eventDate.toISOString().split('T')[0];

    const periodicEventsOnDay = allEvents.filter((e: GeneratedCalendarEvent) =>
        e.type === 'periodic' &&
        !e.cancelled &&
        e.date.startsWith(targetDateStr)
    );

    if (periodicEventsOnDay.length === 0) return [];

    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const ids = [...new Set(periodicEventsOnDay.map((e: GeneratedCalendarEvent) => e.periodicEventId as string))];
    return periodicEventRepo.find({
        where: { id: In(ids) },
        relations: ['groups', 'groups.subject', 'classrooms']
    });
}

/**
 * Filters periodic events that conflict with a given time range, groups and classrooms.
 */
export function findPeriodicEventConflicts(
    startTime: string,
    endTime: string,
    groupIds: string[],
    classroomIds: string[],
    periodicEvents: PeriodicEvent[],
    eventType: string
): PeriodicEvent[] {
    const normalizeTime = (time: string) => time.substring(0, 5);

    return periodicEvents.filter(periodicEvent => {
        const newStart = normalizeTime(startTime);
        const newEnd = normalizeTime(endTime);
        const periodicStart = normalizeTime(periodicEvent.startTime);
        const periodicEnd = normalizeTime(periodicEvent.endTime);

        const hasTimeOverlap = newStart < periodicEnd && newEnd > periodicStart;
        if (!hasTimeOverlap) return false;

        const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
            periodicEvent.eventType !== EVENT_TYPES.BLOCKER &&
            periodicEvent.groups?.some(g => groupIds.includes(g.id));

        const sharesClassroom = periodicEvent.classrooms?.some(c => classroomIds.includes(c.id));

        return sharesGroup || sharesClassroom;
    });
}

/**
 * Mapea un evento generado a ConflictEntry filtrando los grupos/aulas compartidos.
 * Requiere que el evento haya sido producido por generateCalendarEvents(), que incluye
 * subject dentro de cada grupo desde calendar-events.service.ts.
 */
export function toConflictEntry(
    event: GeneratedCalendarEvent,
    groupIds: string[],
    classroomIds: string[]
): ConflictEntry {
    return {
        id: event.id,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type,
        groupNames: event.groups
            .filter(g => groupIds.includes(g.id))
            .map(g => g.subject ? `${g.subject.acronym}.${g.type}.${g.number}` : `${g.type}.${g.number}`),
        classroomNames: event.classrooms
            .filter(c => classroomIds.includes(c.id))
            .map(c => c.code),
    };
}
