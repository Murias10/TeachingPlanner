import { AppDataSource } from '@/config/data-source';
import { CalendarSync, SyncStatus } from '@/entities/calendar-sync.entity';
import { GoogleClassroomCalendar } from '@/entities/google-classroom-calendar.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Classroom } from '@/entities/classroom.entity';
import { CalendarEventsService } from '@/services/calendar-events.service';
import { ApiQuotaCounter } from '@/entities/api-quota-counter.entity';

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
    extendedProperties?: {
        private?: {
            academicCalendarId?: string;
        };
    };
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

    // Rate limiter: Google allows 600 requests per minute per user
    // Using 400 to have a safer margin and account for parallel requests
    private static readonly MAX_REQUESTS_PER_MINUTE = 400;
    private static readonly ESTIMATED_DAILY_REQUEST_LIMIT = 10000;
    private static readonly ESTIMATED_DAILY_CALENDAR_CREATION_LIMIT = 150;
    private static readonly QUOTA_KEY = 'google_calendar';

    // In-memory cache — loaded from DB on startup via initQuotaCounters()
    private static requestCount = 0;
    private static requestWindowStart = Date.now();
    private static dailyRequestCount = 0;
    private static dailyCalendarCreations = 0;
    private static dailyWindowStart = Date.now();

    /**
     * Rate limiter to avoid exceeding Google Calendar API quotas
     * Implements a sliding window with automatic reset and throttling
     */
    private static async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const windowDuration = 60000; // 1 minute
        const dayDuration = 86400000; // 24 hours

        // Reset daily counter at midnight (or after 24h)
        if (now - this.dailyWindowStart >= dayDuration) {
            this.dailyRequestCount = 0;
            this.dailyCalendarCreations = 0;
            this.dailyWindowStart = now;
        }

        // Reset per-minute counter if window has passed
        if (now - this.requestWindowStart >= windowDuration) {
            console.log(`[RATE LIMITER] Window reset - processed ${this.requestCount} requests in last minute`);
            this.requestCount = 0;
            this.requestWindowStart = now;
        }

        // If approaching limit, wait until next window
        if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
            const waitTime = windowDuration - (now - this.requestWindowStart);
            console.log(`[RATE LIMITER] ⚠️  Reached limit (${this.requestCount}/${this.MAX_REQUESTS_PER_MINUTE}), pausing for ${Math.ceil(waitTime/1000)}s`);
            await new Promise(resolve => setTimeout(resolve, waitTime + 500));
            this.requestCount = 0;
            this.requestWindowStart = Date.now();
            console.log(`[RATE LIMITER] ✓ Resumed - new window started`);
        }

        // Small delay between requests to spread them out
        if (this.requestCount > 0 && this.requestCount % 50 === 0) {
            console.log(`[RATE LIMITER] Progress: ${this.requestCount}/${this.MAX_REQUESTS_PER_MINUTE} requests in current window`);
        }

        this.requestCount++;
        this.dailyRequestCount++;
        this.persistQuotaCounters();

        // Add a tiny delay between each request to prevent bursts
        await new Promise(resolve => setTimeout(resolve, 150)); // 150ms between requests = max 400/min
    }

    /**
     * Returns current rate limit status for diagnostics
     */
    static getRateLimitStatus() {
        const now = Date.now();
        const windowDuration = 60000;
        const dayDuration = 86400000;

        const minuteElapsed = now - this.requestWindowStart;
        const windowResetInMs = minuteElapsed >= windowDuration ? 0 : windowDuration - minuteElapsed;

        const dayElapsed = now - this.dailyWindowStart;
        const dailyResetInMs = dayElapsed >= dayDuration ? 0 : dayDuration - dayElapsed;

        return {
            minute: {
                used: this.requestCount,
                limit: this.MAX_REQUESTS_PER_MINUTE,
                windowResetInMs
            },
            daily: {
                used: this.dailyRequestCount,
                estimatedLimit: this.ESTIMATED_DAILY_REQUEST_LIMIT,
                resetInMs: dailyResetInMs
            },
            calendarsCreatedToday: {
                used: this.dailyCalendarCreations,
                estimatedLimit: this.ESTIMATED_DAILY_CALENDAR_CREATION_LIMIT
            }
        };
    }

    /**
     * Load quota counters from DB into memory on server startup.
     * Creates the row if it doesn't exist yet.
     */
    static async initQuotaCounters(): Promise<void> {
        try {
            const repo = AppDataSource.getRepository(ApiQuotaCounter);
            const now = Date.now();
            const dayDuration = 86400000;

            let row = await repo.findOne({ where: { apiKey: this.QUOTA_KEY } });

            if (!row) {
                row = repo.create({
                    apiKey: this.QUOTA_KEY,
                    minuteCount: 0,
                    minuteWindowStart: now,
                    dailyCount: 0,
                    dailyCalendarCreations: 0,
                    dailyWindowStart: now,
                });
                await repo.save(row);
            }

            // bigint columns come back as strings from MariaDB
            const dailyWindowStart = Number(row.dailyWindowStart);
            const minuteWindowStart = Number(row.minuteWindowStart);

            // Reset daily counters if the window has expired
            if (now - dailyWindowStart >= dayDuration) {
                this.dailyRequestCount = 0;
                this.dailyCalendarCreations = 0;
                this.dailyWindowStart = now;
            } else {
                this.dailyRequestCount = row.dailyCount;
                this.dailyCalendarCreations = row.dailyCalendarCreations;
                this.dailyWindowStart = dailyWindowStart;
            }

            // Reset per-minute counter if the window has expired
            if (now - minuteWindowStart >= 60000) {
                this.requestCount = 0;
                this.requestWindowStart = now;
            } else {
                this.requestCount = row.minuteCount;
                this.requestWindowStart = minuteWindowStart;
            }

            console.log(`[QUOTA] Loaded from DB — minute: ${this.requestCount}, daily: ${this.dailyRequestCount}, calendars: ${this.dailyCalendarCreations}`);
        } catch (error) {
            console.error('[QUOTA] Failed to load quota counters from DB, starting from 0:', error);
        }
    }

    /**
     * Persist current in-memory counters to DB asynchronously (fire-and-forget).
     */
    private static persistQuotaCounters(): void {
        const repo = AppDataSource.getRepository(ApiQuotaCounter);
        repo.save({
            apiKey: this.QUOTA_KEY,
            minuteCount: this.requestCount,
            minuteWindowStart: this.requestWindowStart,
            dailyCount: this.dailyRequestCount,
            dailyCalendarCreations: this.dailyCalendarCreations,
            dailyWindowStart: this.dailyWindowStart,
        }).catch(err => console.error('[QUOTA] Failed to persist quota counters:', err));
    }

    /**
     * Initialize CalendarSync entries only (lightweight, instant)
     * Called from OAuth callback
     */
    static async initializeCalendarSyncEntries(
        userId: string,
        userEmail: string
    ): Promise<{ count: number }> {
        const calendarRepo = AppDataSource.getRepository(Calendar);
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        try {
            // Get all existing calendars
            const calendars = await calendarRepo.find();
            let count = 0;

            // Create CalendarSync entries for all calendars (initially disabled)
            for (const calendar of calendars) {
                try {
                    // Check if already exists (idempotency)
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

                    count++;
                } catch (error: any) {
                    console.error(`Error creating sync for calendar ${calendar.id}:`, error);
                }
            }

            return { count };
        } catch (error: any) {
            throw new Error(`Failed to initialize calendar sync entries: ${error.message}`);
        }
    }

    /**
     * Ensure Google Calendar exists for a classroom (lazy creation with duplicate prevention)
     * Returns existing calendar if found, creates new one if not
     */
    static async ensureGoogleCalendarForClassroom(
        userId: string,
        classroomId: string,
        classroomCode: string,
        accessToken: string,
        userEmail: string
    ): Promise<GoogleClassroomCalendar | null> {
        const googleCalendarRepo = AppDataSource.getRepository(GoogleClassroomCalendar);

        try {
            // Check if already exists (idempotency - prevents duplicates)
            const existing = await googleCalendarRepo.findOne({
                where: { userId, classroomId }
            });

            if (existing) {
                return existing; // Return existing calendar
            }

            // Create Google Calendar via API
            const googleCalendar = await this.createGoogleCalendar(
                accessToken,
                classroomCode
            );

            if (!googleCalendar) {
                return null;
            }

            // Save to database
            const saved = await googleCalendarRepo.save({
                userId,
                classroomId,
                googleCalendarId: googleCalendar.id,
                googleCalendarName: googleCalendar.summary,
                createdBy: userEmail
            });

            return saved;
        } catch (error: any) {
            console.error(`Error ensuring Google Calendar for classroom ${classroomCode}:`, error);
            return null;
        }
    }

    /**
     * Get all calendar syncs for a user (academic calendars with their sync status)
     */
    static async getCalendarSyncsForUser(userId: string) {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Auto-create missing CalendarSync entries for new calendars
        const allCalendars = await calendarRepo.find();
        for (const calendar of allCalendars) {
            const existing = await syncRepo.findOne({
                where: { userId, calendarId: calendar.id }
            });

            if (!existing) {
                // Create new CalendarSync entry for this calendar
                const newSync = syncRepo.create({
                    userId,
                    calendarId: calendar.id,
                    calendar,
                    syncEnabled: false,
                    syncStatus: SyncStatus.IDLE
                });
                await syncRepo.save(newSync);
            }
        }

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
     * When disabling, cleans up Google Calendar events
     */
    static async toggleSyncEnabled(syncId: string, accessToken?: string): Promise<CalendarSync | null> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        const sync = await syncRepo.findOne({
            where: { id: syncId },
            relations: ['calendar']
        });
        if (!sync) return null;

        const wasEnabled = sync.syncEnabled;
        sync.syncEnabled = !sync.syncEnabled;

        // If disabling a sync that was previously enabled, clean up Google Calendar events
        if (wasEnabled && !sync.syncEnabled) {
            // Reset status to IDLE when disabling
            sync.syncStatus = SyncStatus.IDLE;
            sync.errorMessage = undefined;
            sync.lastSyncAt = undefined;
            sync.totalCalendars = undefined;
            sync.processedCalendars = undefined;
            sync.currentOperation = undefined;

            if (accessToken) {
                console.log(`[SYNC] Disabling sync ${syncId}, cleaning up Google Calendar events...`);
                try {
                    await this.cleanupCalendarEvents(sync.calendar.id, sync.userId, accessToken);
                } catch (error) {
                    console.error('[SYNC] Error cleaning up calendar events:', error);
                    // Continue with toggling even if cleanup fails
                }
            }
        }

        return await syncRepo.save(sync);
    }

    /**
     * Clean up Google Calendar events for a specific academic calendar
     * Deletes events from Google Calendars, and removes entire calendars if they become empty
     */
    private static async cleanupCalendarEvents(
        academicCalendarId: string,
        userId: string,
        accessToken: string
    ): Promise<void> {
        const googleCalendarRepo = AppDataSource.getRepository(GoogleClassroomCalendar);

        // Get all Google Calendars for this user
        const userGoogleCalendars = await googleCalendarRepo.find({
            where: { userId },
            relations: ['classroom']
        });

        console.log(`[CLEANUP] Found ${userGoogleCalendars.length} Google Calendars for user`);

        for (const googleCal of userGoogleCalendars) {
            try {
                // List all events in this Google Calendar
                const eventsResponse = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCal.googleCalendarId)}/events?maxResults=2500`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Accept': 'application/json'
                        }
                    }
                );

                if (!eventsResponse.ok) {
                    console.warn(`[CLEANUP] Failed to list events for calendar ${googleCal.classroom.code}: ${eventsResponse.status}`);
                    continue;
                }

                const eventsData = await eventsResponse.json();
                const allEvents = eventsData.items || [];

                // Filter events that belong to this academic calendar
                const eventsToDelete = allEvents.filter((event: any) =>
                    event.extendedProperties?.private?.academicCalendarId === academicCalendarId
                );

                // Filter events that belong to OTHER academic calendars
                const eventsToKeep = allEvents.filter((event: any) =>
                    event.extendedProperties?.private?.academicCalendarId &&
                    event.extendedProperties.private.academicCalendarId !== academicCalendarId
                );

                console.log(`[CLEANUP] Calendar ${googleCal.classroom.code}: ${allEvents.length} total events, ${eventsToDelete.length} to delete, ${eventsToKeep.length} to keep`);

                // Delete events from this academic calendar
                for (const event of eventsToDelete) {
                    try {
                        const deleteResponse = await fetch(
                            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCal.googleCalendarId)}/events/${event.id}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`
                                }
                            }
                        );

                        if (!deleteResponse.ok && deleteResponse.status !== 404) {
                            console.warn(`[CLEANUP] Failed to delete event ${event.id}: ${deleteResponse.status}`);
                        }

                        // Rate limiting: 150ms between requests
                        await new Promise(resolve => setTimeout(resolve, 150));
                    } catch (error) {
                        console.error(`[CLEANUP] Error deleting event ${event.id}:`, error);
                    }
                }

                // If no events remain from other calendars, delete the entire Google Calendar
                if (eventsToKeep.length === 0 && eventsToDelete.length > 0) {
                    console.log(`[CLEANUP] Calendar ${googleCal.classroom.code} is now empty, deleting it...`);

                    try {
                        const deleteCalResponse = await fetch(
                            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCal.googleCalendarId)}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`
                                }
                            }
                        );

                        if (deleteCalResponse.ok || deleteCalResponse.status === 404) {
                            // Delete from our database
                            await googleCalendarRepo.remove(googleCal);
                            console.log(`[CLEANUP] Deleted empty Google Calendar ${googleCal.classroom.code}`);
                        } else {
                            console.warn(`[CLEANUP] Failed to delete Google Calendar ${googleCal.classroom.code}: ${deleteCalResponse.status}`);
                        }
                    } catch (error) {
                        console.error(`[CLEANUP] Error deleting Google Calendar ${googleCal.classroom.code}:`, error);
                    }
                }

                // Rate limiting between calendars
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error) {
                console.error(`[CLEANUP] Error processing calendar ${googleCal.classroom.code}:`, error);
            }
        }

        console.log(`[CLEANUP] Finished cleaning up events for academic calendar ${academicCalendarId}`);
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
            // 1. Get all events from this academic calendar
            const events = await CalendarEventsService.generateCalendarEvents(sync.calendar.id);

            // 2. Determine which classrooms are needed for this calendar's events
            const neededClassrooms = new Set<string>();
            for (const event of events) {
                const eventClassrooms = event.classrooms || [];
                for (const classroom of eventClassrooms) {
                    neededClassrooms.add(classroom.id);
                }
            }

            console.log(`[SYNC] Academic calendar needs ${neededClassrooms.size} classrooms`);

            // 3. Ensure Google Calendars exist for needed classrooms (lazy creation)
            const classroomToGoogleCal: Record<string, string> = {};

            // Get existing Google Calendars for this user
            const existingGoogleCals = await googleCalendarRepo.find({
                where: { userId: sync.userId },
                relations: ['classroom']
            });

            // Map existing calendars
            for (const gcc of existingGoogleCals) {
                classroomToGoogleCal[gcc.classroomId] = gcc.googleCalendarId;
            }

            console.log(`[SYNC] User already has ${existingGoogleCals.length} Google Calendars`);

            // Create Google Calendars for missing classrooms (on-demand)
            const classroomRepo = AppDataSource.getRepository(Classroom);
            const classroomsToCreate = Array.from(neededClassrooms).filter(id => !classroomToGoogleCal[id]);

            if (classroomsToCreate.length > 0) {
                console.log(`[SYNC] Need to create ${classroomsToCreate.length} new Google Calendars`);

                // Update progress
                sync.totalCalendars = classroomsToCreate.length;
                sync.processedCalendars = 0;
                sync.currentOperation = `Creando ${classroomsToCreate.length} calendarios nuevos...`;
                await syncRepo.save(sync);

                let createdCount = 0;
                let failedCount = 0;
                for (const classroomId of classroomsToCreate) {
                    // Fetch classroom info
                    const classroom = await classroomRepo.findOne({ where: { id: classroomId } });

                    if (classroom) {
                        createdCount++;
                        sync.processedCalendars = createdCount;
                        sync.currentOperation = `Creando calendario ${createdCount}/${classroomsToCreate.length}: ${classroom.code}`;
                        await syncRepo.save(sync);

                        // Create Google Calendar on-demand with duplicate prevention
                        const googleCal = await this.ensureGoogleCalendarForClassroom(
                            sync.userId,
                            classroomId,
                            classroom.code,
                            accessToken,
                            sync.createdBy || 'system'
                        );

                        if (googleCal) {
                            classroomToGoogleCal[classroomId] = googleCal.googleCalendarId;
                            console.log(`[SYNC] Created Google Calendar for classroom ${classroom.code}`);
                        } else {
                            failedCount++;
                            console.error(`[SYNC] Failed to create Google Calendar for classroom ${classroom.code}`);
                        }
                    }
                }

                console.log(`[SYNC] Created ${createdCount - failedCount} new Google Calendars (${failedCount} failed)`);

                // If all calendars failed to create, throw error about quota limits
                if (failedCount > 0 && failedCount === classroomsToCreate.length) {
                    throw new Error('No se pudieron crear los calendarios de Google. Has excedido el límite diario de creación de calendarios. Por favor, inténtalo de nuevo mañana.');
                } else if (failedCount > 0) {
                    throw new Error(`Se crearon ${createdCount - failedCount} calendarios, pero ${failedCount} fallaron debido a límites de Google Calendar. Por favor, inténtalo de nuevo más tarde.`);
                }
            } else {
                console.log(`[SYNC] All needed Google Calendars already exist`);
            }

            // 4. Distribute events to classroom Google Calendars using batch insert
            const eventsByCalendar: Record<string, any[]> = {};

            // Group events by Google Calendar
            for (const event of events) {
                const eventClassrooms = event.classrooms || [];

                for (const classroom of eventClassrooms) {
                    const googleCalendarId = classroomToGoogleCal[classroom.id];

                    if (!googleCalendarId) {
                        console.warn(`Could not create/find Google Calendar for classroom ${classroom.id}`);
                        continue;
                    }

                    if (!eventsByCalendar[googleCalendarId]) {
                        eventsByCalendar[googleCalendarId] = [];
                    }

                    // Convert to Google Calendar event format with academic calendar ID
                    const googleEvent = this.convertToGoogleEvent(event, sync.calendar.id);
                    eventsByCalendar[googleCalendarId].push(googleEvent);
                }
            }

            // Clear and insert events for each calendar with progress tracking
            const totalCalendars = Object.keys(eventsByCalendar).length;
            let processedCalendars = 0;
            let eventsProcessed = 0;

            // Update initial progress
            sync.totalCalendars = totalCalendars;
            sync.processedCalendars = 0;
            sync.currentOperation = `Procesando ${totalCalendars} aulas...`;
            await syncRepo.save(sync);

            for (const [googleCalendarId, calendarEvents] of Object.entries(eventsByCalendar)) {
                // Update current operation
                processedCalendars++;
                sync.processedCalendars = processedCalendars;
                sync.currentOperation = `Limpiando aula ${processedCalendars}/${totalCalendars}...`;
                await syncRepo.save(sync);

                // Step 1: Clear existing events ONLY from this academic calendar
                console.log(`[${processedCalendars}/${totalCalendars}] Clearing events from academic calendar ${sync.calendar.id}`);
                await this.clearAcademicCalendarEvents(accessToken, googleCalendarId, sync.calendar.id);

                // Update operation
                sync.currentOperation = `Insertando eventos en aula ${processedCalendars}/${totalCalendars} (${calendarEvents.length} eventos)...`;
                await syncRepo.save(sync);

                // Step 2: Insert new events
                console.log(`[${processedCalendars}/${totalCalendars}] Inserting ${calendarEvents.length} events to calendar ${googleCalendarId}`);

                const result = await this.batchInsertEvents(
                    accessToken,
                    googleCalendarId,
                    calendarEvents
                );

                eventsProcessed += result;
                console.log(`[${processedCalendars}/${totalCalendars}] Successfully inserted ${result}/${calendarEvents.length} events`);
            }

            // Update sync status - clear progress fields
            sync.lastSyncAt = new Date();
            sync.syncStatus = SyncStatus.SUCCESS;
            sync.errorMessage = null as any;
            sync.totalCalendars = null as any;
            sync.processedCalendars = null as any;
            sync.currentOperation = null as any;
            await syncRepo.save(sync);

            return {
                success: true,
                message: `Calendar synced successfully (${eventsProcessed} event placements)`
            };
        } catch (error: any) {
            // Update status to error - clear progress fields
            sync.syncStatus = SyncStatus.ERROR;
            sync.errorMessage = error.message || 'Unknown error during sync';
            sync.totalCalendars = null as any;
            sync.processedCalendars = null as any;
            sync.currentOperation = null as any;
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

        console.log(`[DELETE ALL USER SYNCS] Starting cleanup for user ${userId}`);
        console.log(`[DELETE ALL USER SYNCS] Access token provided: ${!!accessToken}`);

        let deletedGoogleCalendars = 0;

        // Delete Google Calendars if access token provided
        if (accessToken) {
            const googleCalendars = await googleCalendarRepo.find({ where: { userId } });
            console.log(`[DELETE ALL USER SYNCS] Found ${googleCalendars.length} Google Calendars to delete`);

            for (const gcal of googleCalendars) {
                const calendarName = gcal.googleCalendarName || 'Unknown';
                console.log(`[DELETE ALL USER SYNCS] Attempting to delete Google Calendar: ${gcal.googleCalendarId} (${calendarName})`);
                const deleted = await this.deleteGoogleCalendar(accessToken, gcal.googleCalendarId);
                if (deleted) {
                    console.log(`[DELETE ALL USER SYNCS] ✓ Successfully deleted Google Calendar: ${calendarName}`);
                    deletedGoogleCalendars++;
                } else {
                    console.error(`[DELETE ALL USER SYNCS] ✗ Failed to delete Google Calendar: ${calendarName}`);
                }
            }
            console.log(`[DELETE ALL USER SYNCS] Deleted ${deletedGoogleCalendars}/${googleCalendars.length} Google Calendars`);
        } else {
            console.warn(`[DELETE ALL USER SYNCS] No access token provided - skipping Google Calendar deletion`);
        }

        // Delete from database
        const googleCalendars = await googleCalendarRepo.find({ where: { userId } });
        await googleCalendarRepo.remove(googleCalendars);
        console.log(`[DELETE ALL USER SYNCS] Deleted ${googleCalendars.length} GoogleClassroomCalendar records from database`);

        const syncs = await syncRepo.find({ where: { userId } });
        await syncRepo.remove(syncs);
        console.log(`[DELETE ALL USER SYNCS] Deleted ${syncs.length} CalendarSync records from database`);

        console.log(`[DELETE ALL USER SYNCS] Cleanup complete: ${deletedGoogleCalendars} Google Calendars, ${syncs.length} syncs`);

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
            await this.waitForRateLimit();
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

            this.dailyCalendarCreations++;
            this.persistQuotaCounters();
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
            await this.waitForRateLimit();
            const response = await fetch(
                `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to delete Google Calendar ${googleCalendarId}: ${response.status} ${errorText}`);
            }

            return response.ok;
        } catch (error) {
            console.error(`Error deleting Google Calendar ${googleCalendarId}:`, error);
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

            console.log('Upserting event to Google Calendar:', JSON.stringify(event, null, 2));

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to upsert Google event:', errorText);
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
     * Batch insert events into Google Calendar with strict rate limiting
     * Processes requests sequentially to avoid exceeding Google's quota
     */
    private static async batchInsertEvents(
        accessToken: string,
        googleCalendarId: string,
        events: GoogleCalendarEvent[]
    ): Promise<number> {
        let successCount = 0;

        console.log(`Starting rate-limited insert of ${events.length} events (sequential processing)`);

        // Process events sequentially to strictly control rate
        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            // Rate limit check before each request
            await this.waitForRateLimit();

            try {
                const response = await fetch(
                    `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(event)
                    }
                );

                if (response.ok) {
                    successCount++;
                } else {
                    const error = await response.text();
                    console.error(`Event insert failed (${i + 1}/${events.length}):`, error);
                }
            } catch (error) {
                console.error(`Event insert error (${i + 1}/${events.length}):`, error);
            }

            // Log progress every 20 events
            if ((i + 1) % 20 === 0 || i === events.length - 1) {
                console.log(`Progress: ${i + 1}/${events.length} events processed (${successCount} successful)`);
            }
        }

        return successCount;
    }

    /**
     * Clear events from a specific academic calendar in a Google Calendar
     * Only deletes events that belong to the specified academic calendar
     */
    private static async clearAcademicCalendarEvents(
        accessToken: string,
        googleCalendarId: string,
        academicCalendarId: string
    ): Promise<number> {
        try {
            // Step 1: Get all events from the calendar with private extended properties
            await this.waitForRateLimit();
            const listUrl = `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events?maxResults=2500&privateExtendedProperty=academicCalendarId=${academicCalendarId}`;
            const listResponse = await fetch(listUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!listResponse.ok) {
                console.error('Failed to list events:', await listResponse.text());
                return 0;
            }

            const listData = await listResponse.json();
            const events = listData.items || [];

            if (events.length === 0) {
                console.log(`No events found for academic calendar ${academicCalendarId}`);
                return 0;
            }

            console.log(`Found ${events.length} events from academic calendar ${academicCalendarId} to delete`);

            // Step 2: Delete events sequentially with rate limiting
            let deleteCount = 0;

            for (let i = 0; i < events.length; i++) {
                const event = events[i];

                await this.waitForRateLimit();

                try {
                    const response = await fetch(
                        `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events/${event.id}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );

                    if (response.ok || response.status === 410) {
                        // 410 Gone means event was already deleted
                        deleteCount++;
                    }
                } catch (error) {
                    console.error(`Failed to delete event ${i + 1}/${events.length}:`, error);
                }

                // Log progress every 20 deletions
                if ((i + 1) % 20 === 0 || i === events.length - 1) {
                    console.log(`Delete progress: ${deleteCount}/${events.length} events deleted`);
                }
            }

            console.log(`Successfully deleted ${deleteCount}/${events.length} events from academic calendar ${academicCalendarId}`);
            return deleteCount;
        } catch (error) {
            console.error('Error clearing academic calendar events:', error);
            return 0;
        }
    }

    /**
     * Clear all events from a Google Calendar with strict rate limiting
     */
    private static async clearCalendarEvents(
        accessToken: string,
        googleCalendarId: string
    ): Promise<number> {
        try {
            // Step 1: Get all events from the calendar
            await this.waitForRateLimit();
            const listUrl = `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events?maxResults=2500`;
            const listResponse = await fetch(listUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!listResponse.ok) {
                console.error('Failed to list events:', await listResponse.text());
                return 0;
            }

            const listData = await listResponse.json();
            const events = listData.items || [];

            if (events.length === 0) {
                console.log('No events to clear');
                return 0;
            }

            console.log(`Found ${events.length} events to delete (sequential processing)`);

            // Step 2: Delete events sequentially with rate limiting
            let deleteCount = 0;

            for (let i = 0; i < events.length; i++) {
                const event = events[i];

                await this.waitForRateLimit();

                try {
                    const response = await fetch(
                        `${this.GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events/${event.id}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );

                    if (response.ok || response.status === 410) {
                        // 410 Gone means event was already deleted
                        deleteCount++;
                    }
                } catch (error) {
                    console.error(`Failed to delete event ${i + 1}/${events.length}:`, error);
                }

                // Log progress every 20 deletions
                if ((i + 1) % 20 === 0 || i === events.length - 1) {
                    console.log(`Delete progress: ${deleteCount}/${events.length} events deleted`);
                }
            }

            console.log(`Successfully deleted ${deleteCount}/${events.length} events`);
            return deleteCount;
        } catch (error) {
            console.error('Error clearing calendar events:', error);
            return 0;
        }
    }

    /**
     * Convert internal event to Google Calendar event format
     */
    private static convertToGoogleEvent(event: any, academicCalendarId: string): GoogleCalendarEvent {
        // Extract date from event.date (ISO string like "2024-01-15T08:00:00.000Z")
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toISOString().split('T')[0]; // "2024-01-15"

        // Ensure time is in HH:MM:SS format
        const formatTime = (time: string): string => {
            if (!time) return '00:00:00';
            // If already HH:MM:SS, return as is
            if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time;
            // If HH:MM, add :00
            if (time.match(/^\d{2}:\d{2}$/)) return `${time}:00`;
            // Otherwise return as is
            return time;
        };

        const startTime = formatTime(event.startTime);
        const endTime = formatTime(event.endTime);

        // Build ISO datetime strings from date + time fields
        const startDateTime = `${dateStr}T${startTime}`;
        const endDateTime = `${dateStr}T${endTime}`;

        // Build subject name with group info using format: Acronym.Type.Number or Acronym.Type.I-Number for English
        let summary = event.subject?.acronym || 'Sin título';
        if (event.groups && event.groups.length > 0) {
            const groupParts = event.groups.map((g: any) => {
                const type = g.type || 'T'; // Default to T if no type
                const isEnglish = g.language === 'EN';
                const groupNumber = isEnglish ? `I-${g.number}` : g.number;
                return `${type}.${groupNumber}`;
            });
            summary = `${summary}.${groupParts.join(',')}`;
        }

        return {
            summary,
            description: event.subject?.name || '',
            location: event.classrooms?.map((c: any) => c.code).join(', ') || '',
            start: {
                dateTime: startDateTime,
                timeZone: this.TIME_ZONE
            },
            end: {
                dateTime: endDateTime,
                timeZone: this.TIME_ZONE
            },
            // Store academic calendar ID to identify events later
            extendedProperties: {
                private: {
                    academicCalendarId: academicCalendarId
                }
            }
            // colorId removed - events will inherit the calendar's color
        };
    }
}
