import { AppDataSource } from '@/config/data-source';
import { CalendarSync, SyncStatus } from '@/entities/calendar-sync.entity';
import { Calendar } from '@/entities/calendar.entity';
import { CalendarEventsService } from '@/services/calendar-events.service';

interface GoogleCalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    colorId?: string;
}

interface GoogleCalendarCreateResponse {
    id: string;
    summary: string;
}

/**
 * Service for synchronizing calendars with Google Calendar
 */
export class GoogleCalendarService {
    private static readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
    private static readonly TIME_ZONE = 'Europe/Madrid';

    /**
     * Create a new Google Calendar for a classroom/calendar
     */
    static async createGoogleCalendar(
        accessToken: string,
        calendarName: string
    ): Promise<GoogleCalendarCreateResponse | null> {
        try {
            const response = await fetch(`${this.GOOGLE_CALENDAR_API}/calendars`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    summary: calendarName,
                    timeZone: this.TIME_ZONE
                })
            });

            if (!response.ok) {
                console.error('Failed to create Google Calendar:', await response.text());
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating Google Calendar:', error);
            return null;
        }
    }

    /**
     * Delete a Google Calendar
     */
    static async deleteGoogleCalendar(
        accessToken: string,
        googleCalendarId: string
    ): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Error deleting Google Calendar:', error);
            return false;
        }
    }

    /**
     * Create or update an event in Google Calendar
     */
    static async upsertGoogleEvent(
        accessToken: string,
        googleCalendarId: string,
        event: GoogleCalendarEvent,
        existingEventId?: string
    ): Promise<string | null> {
        try {
            const url = existingEventId
                ? `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events/${existingEventId}`
                : `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events`;

            const response = await fetch(url, {
                method: existingEventId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                console.error('Failed to upsert Google event:', await response.text());
                return null;
            }

            const result = await response.json();
            return result.id;
        } catch (error) {
            console.error('Error upserting Google event:', error);
            return null;
        }
    }

    /**
     * Delete an event from Google Calendar
     */
    static async deleteGoogleEvent(
        accessToken: string,
        googleCalendarId: string,
        eventId: string
    ): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events/${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            return response.ok || response.status === 404;
        } catch (error) {
            console.error('Error deleting Google event:', error);
            return false;
        }
    }

    /**
     * Sync a calendar to Google Calendar
     */
    static async syncCalendarToGoogle(
        calendarSyncId: string,
        accessToken: string
    ): Promise<{ success: boolean; message: string }> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const calendarRepo = AppDataSource.getRepository(Calendar);

        const calendarSync = await syncRepo.findOne({
            where: { id: calendarSyncId },
            relations: ['calendar', 'calendar.course', 'calendar.course.degree']
        });

        if (!calendarSync) {
            return { success: false, message: 'Calendar sync configuration not found' };
        }

        if (!calendarSync.syncEnabled) {
            return { success: false, message: 'Sync is disabled for this calendar' };
        }

        // Update status to syncing
        calendarSync.syncStatus = SyncStatus.SYNCING;
        await syncRepo.save(calendarSync);

        try {
            // Create Google Calendar if not exists
            if (!calendarSync.googleCalendarId) {
                const calendarName = this.buildCalendarName(calendarSync.calendar);
                const googleCalendar = await this.createGoogleCalendar(accessToken, calendarName);

                if (!googleCalendar) {
                    throw new Error('Failed to create Google Calendar');
                }

                calendarSync.googleCalendarId = googleCalendar.id;
                calendarSync.googleCalendarName = googleCalendar.summary;
            }

            // Get all events from the local calendar
            const events = await CalendarEventsService.generateCalendarEvents(calendarSync.calendar.id);

            // Initialize event mappings if not exists
            const eventMappings: Record<string, string> = calendarSync.eventMappings || {};

            // Sync each event
            for (const event of events) {
                const googleEvent = this.convertToGoogleEvent(event);
                const existingGoogleEventId = eventMappings[event.id];

                const googleEventId = await this.upsertGoogleEvent(
                    accessToken,
                    calendarSync.googleCalendarId,
                    googleEvent,
                    existingGoogleEventId
                );

                if (googleEventId) {
                    eventMappings[event.id] = googleEventId;
                }
            }

            // Update sync record
            calendarSync.eventMappings = eventMappings;
            calendarSync.lastSyncAt = new Date();
            calendarSync.syncStatus = SyncStatus.SUCCESS;
            calendarSync.errorMessage = undefined;
            await syncRepo.save(calendarSync);

            return { success: true, message: 'Calendar synced successfully' };
        } catch (error: any) {
            // Update status to error
            calendarSync.syncStatus = SyncStatus.ERROR;
            calendarSync.errorMessage = error.message || 'Unknown error during sync';
            await syncRepo.save(calendarSync);

            return { success: false, message: calendarSync.errorMessage };
        }
    }

    /**
     * Build calendar name from calendar entity
     */
    private static buildCalendarName(calendar: Calendar): string {
        const course = (calendar as any).course;
        const degree = course?.degree;
        const semester = calendar.semester === 1 ? '1er Semestre' : '2do Semestre';

        if (degree && course) {
            return `${degree.acronym} - ${course.name} - ${semester}`;
        }

        return `Calendario ${semester}`;
    }

    /**
     * Convert local event to Google Calendar event format
     */
    private static convertToGoogleEvent(event: any): GoogleCalendarEvent {
        const startDateTime = new Date(event.date);
        const [startHour, startMin] = event.startTime.split(':').map(Number);
        startDateTime.setHours(startHour, startMin, 0, 0);

        const endDateTime = new Date(event.date);
        const [endHour, endMin] = event.endTime.split(':').map(Number);
        endDateTime.setHours(endHour, endMin, 0, 0);

        const subjectInfo = event.subject ? `${event.subject.acronym} - ${event.subject.name}` : 'Evento';
        const groupsInfo = event.groups?.map((g: any) => `${g.type}${g.number}`).join(', ') || '';
        const classroomsInfo = event.classrooms?.map((c: any) => c.code).join(', ') || '';

        return {
            summary: `${subjectInfo} (${groupsInfo})`,
            description: `Grupos: ${groupsInfo}\nTipo: ${event.type}`,
            location: classroomsInfo,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: this.TIME_ZONE
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: this.TIME_ZONE
            }
        };
    }

    /**
     * Get all calendar syncs for a user
     */
    static async getCalendarSyncsForUser(userId: string): Promise<CalendarSync[]> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        return syncRepo.find({
            where: { userId },
            relations: ['calendar', 'calendar.course', 'calendar.course.degree']
        });
    }

    /**
     * Create a new calendar sync configuration
     */
    static async createCalendarSync(
        userId: string,
        calendarId: string,
        userEmail: string
    ): Promise<CalendarSync> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const calendarRepo = AppDataSource.getRepository(Calendar);

        const calendar = await calendarRepo.findOne({ where: { id: calendarId } });
        if (!calendar) {
            throw new Error('Calendar not found');
        }

        const sync = syncRepo.create({
            userId,
            calendar,
            syncEnabled: true,
            syncStatus: SyncStatus.IDLE,
            createdBy: userEmail
        });

        return syncRepo.save(sync);
    }

    /**
     * Delete a calendar sync configuration
     */
    static async deleteCalendarSync(
        calendarSyncId: string,
        accessToken?: string
    ): Promise<boolean> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        const calendarSync = await syncRepo.findOne({ where: { id: calendarSyncId } });
        if (!calendarSync) {
            return false;
        }

        // Delete Google Calendar if exists and token provided
        if (calendarSync.googleCalendarId && accessToken) {
            await this.deleteGoogleCalendar(accessToken, calendarSync.googleCalendarId);
        }

        await syncRepo.remove(calendarSync);
        return true;
    }

    /**
     * Toggle sync enabled status
     */
    static async toggleSyncEnabled(calendarSyncId: string): Promise<CalendarSync | null> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        const calendarSync = await syncRepo.findOne({ where: { id: calendarSyncId } });
        if (!calendarSync) {
            return null;
        }

        calendarSync.syncEnabled = !calendarSync.syncEnabled;
        return syncRepo.save(calendarSync);
    }
}
