import { AppDataSource } from '@/config/data-source';
import { CalendarSync, SyncStatus } from '@/entities/calendar-sync.entity';
import { GoogleClassroomCalendar } from '@/entities/google-classroom-calendar.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Classroom } from '@/entities/classroom.entity';
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
 * Service for synchronizing academic calendars with Google Calendar
 * New architecture:
 * - One Google Calendar per classroom (created on Google connect)
 * - CalendarSync tracks which academic calendars are enabled
 * - Events are distributed to classroom Google Calendars based on location
 */
export class GoogleCalendarService {
    private static readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
    private static readonly TIME_ZONE = 'Europe/Madrid';

    /**
     * Initialize Google Calendars for all classrooms when user connects Google account
     * Called from OAuth callback
     */
    static async initializeGoogleCalendars(
        userId: string,
        accessToken: string,
        userEmail: string
    ): Promise<{ created: number; errors: string[] }> {
        const classroomRepo = AppDataSource.getRepository(Classroom);
        const googleCalendarRepo = AppDataSource.getRepository(GoogleClassroomCalendar);
        const calendarRepo = AppDataSource.getRepository(Calendar);
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        const errors: string[] = [];
        let created = 0;

        try {
            // 1. Get all classrooms
            const classrooms = await classroomRepo.find();

            // 2. Create Google Calendar for each classroom
            for (const classroom of classrooms) {
                try {
                    // Check if already exists
                    const existing = await googleCalendarRepo.findOne({
                        where: { userId, classroomId: classroom.id }
                    });

                    if (existing) {
                        continue; // Skip if already exists
                    }

                    // Create Google Calendar
                    const googleCalendar = await this.createGoogleCalendar(
                        accessToken,
                        `Aula ${classroom.code}`
                    );

                    if (!googleCalendar) {
                        errors.push(`Failed to create Google Calendar for classroom ${classroom.code}`);
                        continue;
                    }

                    // Save to database
                    await googleCalendarRepo.save({
                        userId,
                        classroomId: classroom.id,
                        googleCalendarId: googleCalendar.id,
                        googleCalendarName: googleCalendar.summary,
                        createdBy: userEmail
                    });

                    created++;
                } catch (error: any) {
                    errors.push(`Error creating calendar for ${classroom.code}: ${error.message}`);
                }
            }

            // 3. Create CalendarSync entries for all existing calendars (initially disabled)
            const calendars = await calendarRepo.find();

            for (const calendar of calendars) {
                try {
                    // Check if already exists
                    const existing = await syncRepo.findOne({
                        where: { userId, calendarId: calendar.id }
                    });

                    if (existing) {
                        continue; // Skip if already exists
                    }

                    // Create sync entry (disabled by default)
                    await syncRepo.save({
                        userId,
                        calendarId: calendar.id,
                        syncEnabled: false,
                        syncStatus: SyncStatus.IDLE,
                        createdBy: userEmail
                    });
                } catch (error: any) {
                    errors.push(`Error creating sync for calendar ${calendar.id}: ${error.message}`);
                }
            }

            return { created, errors };
        } catch (error: any) {
            throw new Error(`Failed to initialize Google Calendars: ${error.message}`);
        }
    }

    /**
     * Get all calendar syncs for a user (academic calendars with their sync status)
     */
    static async getCalendarSyncsForUser(userId: string) {
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        return await syncRepo.find({
            where: { userId },
            relations: ['calendar', 'calendar.course', 'calendar.course.degree'],
            order: {
                calendar: {
                    course: {
                        startYear: 'DESC'
                    },
                    semester: 'ASC'
                }
            }
        });
    }

    /**
     * Toggle sync enabled status for an academic calendar
     */
    static async toggleSyncEnabled(syncId: string): Promise<CalendarSync | null> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        const sync = await syncRepo.findOne({ where: { id: syncId } });
        if (!sync) return null;

        sync.syncEnabled = !sync.syncEnabled;
        return await syncRepo.save(sync);
    }

    /**
     * Sync an academic calendar to Google Calendars
     * Events are distributed to classroom Google Calendars based on location
     */
    static async syncCalendarToGoogle(
        syncId: string,
        accessToken: string
    ): Promise<{ success: boolean; message: string }> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const googleCalendarRepo = AppDataSource.getRepository(GoogleClassroomCalendar);

        const sync = await syncRepo.findOne({
            where: { id: syncId },
            relations: ['calendar']
        });

        if (!sync) {
            return { success: false, message: 'Calendar sync not found' };
        }

        if (!sync.syncEnabled) {
            return { success: false, message: 'Sync is disabled for this calendar' };
        }

        // Update status to syncing
        sync.syncStatus = SyncStatus.SYNCING;
        await syncRepo.save(sync);

        try {
            // 1. Get all classroom Google Calendars for this user
            const googleClassroomCalendars = await googleCalendarRepo.find({
                where: { userId: sync.userId },
                relations: ['classroom']
            });

            if (googleClassroomCalendars.length === 0) {
                throw new Error('No Google Calendars found. Please reconnect your Google account.');
            }

            // Create mapping: classroomId -> googleCalendarId
            const classroomToGoogleCal: Record<string, string> = {};
            for (const gcc of googleClassroomCalendars) {
                classroomToGoogleCal[gcc.classroomId] = gcc.googleCalendarId;
            }

            // 2. Get all events from this academic calendar
            const events = await CalendarEventsService.generateCalendarEvents(sync.calendar.id);

            let eventsProcessed = 0;

            // 3. Distribute events to classroom Google Calendars
            for (const event of events) {
                // Get classrooms where this event occurs
                const eventClassrooms = event.classrooms || [];

                for (const classroom of eventClassrooms) {
                    const googleCalendarId = classroomToGoogleCal[classroom.id];

                    if (!googleCalendarId) {
                        console.warn(`No Google Calendar found for classroom ${classroom.id}`);
                        continue;
                    }

                    // Convert to Google Calendar event format
                    const googleEvent = this.convertToGoogleEvent(event);

                    // Insert/update event in Google Calendar
                    await this.upsertGoogleEvent(
                        accessToken,
                        googleCalendarId,
                        googleEvent
                    );

                    eventsProcessed++;
                }
            }

            // Update sync status
            sync.lastSyncAt = new Date();
            sync.syncStatus = SyncStatus.SUCCESS;
            sync.errorMessage = null as any;
            await syncRepo.save(sync);

            return {
                success: true,
                message: `Calendar synced successfully (${eventsProcessed} event placements)`
            };
        } catch (error: any) {
            // Update status to error
            sync.syncStatus = SyncStatus.ERROR;
            sync.errorMessage = error.message || 'Unknown error during sync';
            await syncRepo.save(sync);

            return { success: false, message: sync.errorMessage || 'Unknown error' };
        }
    }

    /**
     * Delete all Google Calendars and syncs for a user (when disconnecting)
     */
    static async deleteAllUserSyncs(
        userId: string,
        accessToken?: string
    ): Promise<{ deletedSyncs: number; deletedGoogleCalendars: number }> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const googleCalendarRepo = AppDataSource.getRepository(GoogleClassroomCalendar);

        let deletedGoogleCalendars = 0;

        // Delete Google Calendars if access token provided
        if (accessToken) {
            const googleCalendars = await googleCalendarRepo.find({ where: { userId } });

            for (const gcal of googleCalendars) {
                const deleted = await this.deleteGoogleCalendar(accessToken, gcal.googleCalendarId);
                if (deleted) {
                    deletedGoogleCalendars++;
                }
            }
        }

        // Delete from database
        const googleCalendars = await googleCalendarRepo.find({ where: { userId } });
        await googleCalendarRepo.remove(googleCalendars);

        const syncs = await syncRepo.find({ where: { userId } });
        await syncRepo.remove(syncs);

        return {
            deletedSyncs: syncs.length,
            deletedGoogleCalendars
        };
    }

    /**
     * Create a new Google Calendar
     */
    private static async createGoogleCalendar(
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
    private static async deleteGoogleCalendar(
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
     * Insert or update an event in Google Calendar
     */
    private static async upsertGoogleEvent(
        accessToken: string,
        googleCalendarId: string,
        event: GoogleCalendarEvent,
        existingEventId?: string
    ): Promise<string | null> {
        try {
            const url = existingEventId
                ? `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events/${encodeURIComponent(existingEventId)}`
                : `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events`;

            const method = existingEventId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
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
     * Convert internal event to Google Calendar event format
     */
    private static convertToGoogleEvent(event: any): GoogleCalendarEvent {
        return {
            summary: event.title || 'Sin título',
            description: event.description || '',
            location: event.classrooms?.map((c: any) => c.code).join(', ') || '',
            start: {
                dateTime: event.startDate,
                timeZone: this.TIME_ZONE
            },
            end: {
                dateTime: event.endDate,
                timeZone: this.TIME_ZONE
            },
            colorId: event.color?.toString() || '1'
        };
    }
}
