import { AppDataSource } from '@/config/data-source';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';

/**
 * Service for generating and processing calendar events
 * Handles complex logic for combining periodic and puntual events with proper conflict detection
 */
export class CalendarEventsService {
  /**
   * Generate all calendar events for a given calendar ID
   */
  static async generateCalendarEvents(calendarId: string) {
    const dayRepo = AppDataSource.getRepository(Day);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);

    const days = await dayRepo.find({
      where: { calendar: { id: calendarId } },
      relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.groups.subject', 'puntualEvents.classrooms'],
      order: { date: 'ASC' }
    });

    const periodicEvents = await periodicEventRepo.find({
      where: { calendar: { id: calendarId } },
      relations: ['groups', 'groups.subject', 'classrooms']
    });

    const allEvents: any[] = [];
    const dayMap = new Map(days.map(d => [d.date.toISOString().split('T')[0], d]));

    // Process cancelled puntual events
    const cancelledEventsLookup = new Set<string>();
    for (const day of days) {
      for (const puntualEvent of day.puntualEvents || []) {
        if (puntualEvent.cancelled) {
          for (const group of puntualEvent.groups) {
            const key = this.createCancelledEventKey(group.id, day.date, puntualEvent.startTime);
            cancelledEventsLookup.add(key);
          }
        }
      }
    }

    // Calculate hours consumed by puntual events per group (format: "acronym.type.language-number")
    const puntualHoursByGroup = this.calculatePuntualEventHours(days);

    // Process periodic events with character 'N'
    // NOTE: For future extension to other periodicities (L, M, X, J, V), apply the same shared-hour logic
    // The algorithm groups events by group identifier and interleaves event placement
    const periodicEventsN = periodicEvents.filter(pe => pe.eventCharacter.toUpperCase() === 'N');
    this.processPeriodicEventsN(
      periodicEventsN,
      days,
      dayMap,
      cancelledEventsLookup,
      puntualHoursByGroup,
      allEvents
    );

    // Process periodic events with other characters
    const periodicEventsOther = periodicEvents.filter(pe => pe.eventCharacter.toUpperCase() !== 'N');

    for (const periodicEvent of periodicEventsOther) {
      const eventDurationHours = this.calculateDuration(periodicEvent.startTime, periodicEvent.endTime);
      const matchingDatesForCharacter: { [key: string]: boolean } = {};
      const normalizedEventCharacter = periodicEvent.eventCharacter.toUpperCase();

      for (const day of days) {
        const normalizedDayCharacter = day.dayCharacter.toUpperCase();
        if (normalizedDayCharacter === normalizedEventCharacter && day.lective) {
          matchingDatesForCharacter[day.date.toISOString().split('T')[0]] = true;
        }
      }

      let totalHoursScheduled = 0;
      const planifiedHours = periodicEvent.planifiedHours;

      for (const day of days) {
        if (totalHoursScheduled >= planifiedHours) break;

        const dateKey = day.date.toISOString().split('T')[0];
        if (matchingDatesForCharacter[dateKey]) {
          let hasConflict = false;
          for (const group of periodicEvent.groups) {
            if (this.isCancelledEvent(cancelledEventsLookup, group.id, day.date, periodicEvent.startTime)) {
              hasConflict = true;
              break;
            }
          }

          if (!hasConflict) {
            const remainingHours = planifiedHours - totalHoursScheduled;
            const allocatedHours = Math.min(eventDurationHours, remainingHours);

            if (allocatedHours > 0) {
              const event = this.createEventObject(periodicEvent, dateKey, dayMap);
              allEvents.push(event);
              totalHoursScheduled += allocatedHours;
            }
          }
        }
      }
    }

    // Process puntual events
    for (const day of days) {
      for (const puntualEvent of day.puntualEvents || []) {
        if (!puntualEvent.cancelled) {
          const dateKey = day.date.toISOString().split('T')[0];
          const eventDurationHours = this.calculateDuration(puntualEvent.startTime, puntualEvent.endTime);
          const primarySubject = puntualEvent.groups[0]?.subject;

          const event = {
            id: puntualEvent.id,
            date: new Date(`${dateKey}T${puntualEvent.startTime}`).toISOString(),
            startTime: puntualEvent.startTime,
            endTime: puntualEvent.endTime,
            duration: eventDurationHours,
            subject: primarySubject ? {
              id: primarySubject.id,
              acronym: primarySubject.acronym,
              name: primarySubject.name
            } : null,
            groups: puntualEvent.groups.map((g: any) => ({
              id: g.id,
              number: g.number,
              type: g.type,
              language: g.language
            })),
            classrooms: puntualEvent.classrooms.map((c: any) => ({
              id: c.id,
              code: c.code,
              gisUrl: c.gisUrl
            })),
            type: 'puntual',
            cancelled: false,
            puntualEventId: puntualEvent.id,
            dayCharacter: day.dayCharacter || '',
            dayComment: day.comment || ''
          };
          allEvents.push(event);
        }
      }
    }

    return allEvents;
  }

  /**
   * Calculate total hours consumed by puntual events per group
   * Returns a map with key format: "acronym.type.language-number"
   */
  private static calculatePuntualEventHours(days: any[]): Map<string, number> {
    const puntualHoursByGroup = new Map<string, number>();

    for (const day of days) {
      for (const puntualEvent of day.puntualEvents || []) {
        if (!puntualEvent.cancelled) {
          const eventDurationHours = this.calculateDuration(puntualEvent.startTime, puntualEvent.endTime);

          for (const group of puntualEvent.groups) {
            const groupKey = this.buildGroupKey(group);
            const currentHours = puntualHoursByGroup.get(groupKey) || 0;
            puntualHoursByGroup.set(groupKey, currentHours + eventDurationHours);
          }
        }
      }
    }

    return puntualHoursByGroup;
  }

  /**
   * Build group identifier key in format: "acronym.type.language-number"
   */
  private static buildGroupKey(group: any): string {
    return `${group.subject?.acronym || 'N/A'}.${group.type}.${group.language}-${group.number}`;
  }

  /**
   * Process periodic events with character 'N'
   * Groups events by group identifier and distributes shared hours with interleaving
   * For each group: interleaves placement of multiple 'N' events (e.g., Monday, Tuesday, next Monday, next Tuesday...)
   * until the planified hours for that group are exhausted, accounting for puntual event time consumption
   */
  private static processPeriodicEventsN(
    periodicEventsN: any[],
    days: any[],
    dayMap: Map<string, any>,
    cancelledEventsLookup: Set<string>,
    puntualHoursByGroup: Map<string, number>,
    allEvents: any[]
  ): void {
    // Group periodic 'N' events by their group identifiers
    const eventsByGroupKey = new Map<string, any[]>();

    for (const periodicEvent of periodicEventsN) {
      for (const group of periodicEvent.groups) {
        const groupKey = this.buildGroupKey(group);

        if (!eventsByGroupKey.has(groupKey)) {
          eventsByGroupKey.set(groupKey, []);
        }
        eventsByGroupKey.get(groupKey)!.push(periodicEvent);
      }
    }

    const weekDayMap: { [key: string]: number } = { 'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5 };

    // Process each group's events with shared hour budget
    for (const [groupKey, groupPeriodicEvents] of eventsByGroupKey) {
      const planifiedHours = groupPeriodicEvents[0].planifiedHours;
      const puntualHoursUsed = puntualHoursByGroup.get(groupKey) || 0;
      const availableHours = Math.max(0, planifiedHours - puntualHoursUsed);

      // Sort events by weekday to ensure chronological order within each week (Mon before Tue, etc.)
      const sortedEvents = [...groupPeriodicEvents].sort((a, b) => {
        const weekDayA = weekDayMap[a.weekDay] || 6;
        const weekDayB = weekDayMap[b.weekDay] || 6;
        return weekDayA - weekDayB;
      });

      // Create a queue of day indices for each event to enable interleaving
      const eventQueues = sortedEvents.map(event => ({
        event,
        targetWeekDay: weekDayMap[event.weekDay],
        eventDurationHours: this.calculateDuration(event.startTime, event.endTime),
        dayIndex: 0 // Tracks position in the days array for this specific event
      }));

      let totalHoursScheduled = 0;
      let activeEventIndex = 0; // Current event to place in round-robin fashion

      // Interleave placement: cycle through events and place them on matching days
      while (totalHoursScheduled < availableHours && eventQueues.length > 0) {
        const currentQueue = eventQueues[activeEventIndex];
        const { event, targetWeekDay, eventDurationHours } = currentQueue;
        let placed = false;

        // Find next matching day for this event starting from dayIndex
        for (let i = currentQueue.dayIndex; i < days.length; i++) {
          const day = days[i];
          const dayOfWeek = day.date.getDay();

          if (dayOfWeek === targetWeekDay && day.lective) {
            let hasConflict = false;
            for (const group of event.groups) {
              if (this.isCancelledEvent(cancelledEventsLookup, group.id, day.date, event.startTime)) {
                hasConflict = true;
                break;
              }
            }

            if (!hasConflict) {
              const dateKey = day.date.toISOString().split('T')[0];
              const remainingHours = availableHours - totalHoursScheduled;
              const allocatedHours = Math.min(eventDurationHours, remainingHours);

              if (allocatedHours > 0) {
                const eventObj = this.createEventObject(event, dateKey, dayMap);
                allEvents.push(eventObj);
                totalHoursScheduled += allocatedHours;
                currentQueue.dayIndex = i + 1; // Update for next placement
                placed = true;
                break;
              }
            }
          }
        }

        if (!placed) {
          // No more matching days for this event, remove it from queue
          eventQueues.splice(activeEventIndex, 1);
          if (eventQueues.length === 0) break;
          activeEventIndex = activeEventIndex % eventQueues.length;
        } else {
          // Move to next event in round-robin
          activeEventIndex = (activeEventIndex + 1) % eventQueues.length;
        }

        if (totalHoursScheduled >= availableHours) break;
      }
    }
  }

  /**
   * Create event object from periodic event
   */
  private static createEventObject(
    periodicEvent: any,
    dateKey: string,
    dayMap: Map<string, any>
  ) {
    const day = dayMap.get(dateKey);
    const eventDurationHours = this.calculateDuration(periodicEvent.startTime, periodicEvent.endTime);

    return {
      id: `${periodicEvent.id}_${dateKey}`,
      date: new Date(`${dateKey}T${periodicEvent.startTime}`).toISOString(),
      startTime: periodicEvent.startTime,
      endTime: periodicEvent.endTime,
      duration: eventDurationHours,
      subject: periodicEvent.groups[0]?.subject ? {
        id: periodicEvent.groups[0].subject.id,
        acronym: periodicEvent.groups[0].subject.acronym,
        name: periodicEvent.groups[0].subject.name
      } : null,
      groups: periodicEvent.groups.map((g: any) => ({
        id: g.id,
        number: g.number,
        type: g.type,
        language: g.language
      })),
      classrooms: periodicEvent.classrooms.map((c: any) => ({
        id: c.id,
        code: c.code,
        gisUrl: c.gisUrl
      })),
      type: 'periodic',
      cancelled: false,
      periodicEventId: periodicEvent.id,
      dayCharacter: day?.dayCharacter || '',
      dayComment: day?.comment || ''
    };
  }

  /**
   * Create key for cancelled event
   */
  private static createCancelledEventKey(groupId: string, date: Date, startTime: string): string {
    const dateKey = date.toISOString().split('T')[0];
    return `${groupId}_${dateKey}_${startTime}`;
  }

  /**
   * Check if event is cancelled
   */
  private static isCancelledEvent(index: Set<string>, groupId: string, date: Date, startTime: string): boolean {
    const key = this.createCancelledEventKey(groupId, date, startTime);
    return index.has(key);
  }

  /**
   * Calculate duration in hours
   */
  private static calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return durationMinutes / 60;
  }

  /**
   * Detect conflicts between events based on time overlap and shared groups/classrooms
   */
  static detectConflicts(
    newEvent: any,
    existingEvents: any[]
  ): any[] {
    const [newStartMinutes, newEndMinutes] = this.parseTimeRange(newEvent.startTime, newEvent.endTime);
    const newGroupIds = new Set(newEvent.groupIds || []);
    const newClassroomIds = new Set(newEvent.classroomIds || []);

    return existingEvents.filter(event => {
      const [existingStartMinutes, existingEndMinutes] = this.parseTimeRange(event.startTime, event.endTime);
      const hasTimeOverlap = !(newEndMinutes <= existingStartMinutes || newStartMinutes >= existingEndMinutes);

      if (!hasTimeOverlap) return false;

      const existingGroupIds = new Set(event.groups?.map((g: any) => g.id) || []);
      const existingClassroomIds = new Set(event.classrooms?.map((c: any) => c.id) || []);

      const sharesGroup = Array.from(newGroupIds).some(id => existingGroupIds.has(id));
      const sharesClassroom = Array.from(newClassroomIds).some(id => existingClassroomIds.has(id));

      return sharesGroup || sharesClassroom;
    });
  }

  /**
   * Parse time range
   */
  private static parseTimeRange(startTime: string, endTime: string): [number, number] {
    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    return [parseTime(startTime), parseTime(endTime)];
  }
}
