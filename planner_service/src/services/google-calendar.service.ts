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
 * Prefix that signals a structured, i18n-able error to the frontend.
 * Format: "errorCode:<CODE>" or "errorCode:<CODE>:<JSON_PARAMS>"
 * The frontend strips this prefix and looks up calendarSync.syncErrors.<camelCaseCode>
 */
const GOOGLE_ERROR_PREFIX = 'errorCode:';

/**
 * Maps a Google Calendar API HTTP error response to a structured error token.
 *
 * Google API error shape (documented):
 *   { error: { code, message, errors: [{ domain, reason, message }] } }
 *
 * Documented reason values: authError, rateLimitExceeded, userRateLimitExceeded,
 *   quotaExceeded, backendError, notFound, duplicate, conflict, conditionNotMet
 */
function buildGoogleErrorCode(status: number, body: string): string {
    let reason: string | undefined;
    try {
        const parsed = JSON.parse(body) as { error?: { errors?: Array<{ reason?: string }> } };
        reason = parsed?.error?.errors?.[0]?.reason;
    } catch {
        // body is not JSON — fall through to HTTP-status-based mapping
    }

    if (status === 401 || reason === 'authError') {
        return `${GOOGLE_ERROR_PREFIX}GOOGLE_TOKEN_EXPIRED`;
    }
    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded' || status === 429) {
        return `${GOOGLE_ERROR_PREFIX}GOOGLE_RATE_LIMIT`;
    }
    if (reason === 'quotaExceeded') {
        return `${GOOGLE_ERROR_PREFIX}GOOGLE_QUOTA_EXCEEDED`;
    }
    if (reason === 'backendError' || status >= 500) {
        return `${GOOGLE_ERROR_PREFIX}GOOGLE_SERVER_ERROR:${JSON.stringify({ status })}`;
    }
    return `${GOOGLE_ERROR_PREFIX}GOOGLE_UNKNOWN:${JSON.stringify({ status })}`;
}

/**
 * Returns true for error codes that are transient and worth retrying automatically.
 * Token errors and unknown errors are not retryable — they require user action.
 */
function isRetryableErrorCode(errorToken: string): boolean {
    return (
        errorToken.includes('GOOGLE_QUOTA_EXCEEDED') ||
        errorToken.includes('GOOGLE_RATE_LIMIT') ||
        errorToken.includes('GOOGLE_SERVER_ERROR') ||
        errorToken.includes('GOOGLE_NETWORK_ERROR')
    );
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
    // Google enforces an undocumented per-user rate limit on calendar creation
    // (distinct from the general request quota). Empirically ~1 per 5s is safe.
    private static readonly CALENDAR_CREATION_DELAY_MS = 5000;
    private static readonly QUOTA_KEY = 'google_calendar';

    // Retry backoff schedule for quota-exceeded errors: 15m, 15m, 30m, 30m, 30m (~2h total)
    private static readonly RETRY_DELAYS_MS = [
        15 * 60 * 1000,
        15 * 60 * 1000,
        30 * 60 * 1000,
        30 * 60 * 1000,
        30 * 60 * 1000,
    ] as const;
    private static readonly MAX_RETRIES = 5;

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
            const [calendars, existingSyncs] = await Promise.all([
                calendarRepo.find(),
                syncRepo.find({ where: { userId }, select: ['calendarId'] })
            ]);

            const existingIds = new Set(existingSyncs.map(s => s.calendarId));
            const missing = calendars.filter(c => !existingIds.has(c.id));

            if (missing.length > 0) {
                await syncRepo.save(
                    missing.map(c => syncRepo.create({
                        userId,
                        calendarId: c.id,
                        syncStatus: SyncStatus.IDLE,
                        createdBy: userEmail
                    }))
                );
            }

            return { count: missing.length };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to initialize calendar sync entries: ${message}`);
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
    ): Promise<GoogleClassroomCalendar> {
        const googleCalendarRepo = AppDataSource.getRepository(GoogleClassroomCalendar);

        const existing = await googleCalendarRepo.findOne({ where: { userId, classroomId } });
        if (existing) {
            return existing;
        }

        const googleCalendar = await this.createGoogleCalendar(accessToken, classroomCode);

        return googleCalendarRepo.save({
            userId,
            classroomId,
            googleCalendarId: googleCalendar.id,
            googleCalendarName: googleCalendar.summary,
            createdBy: userEmail
        });
    }

    /**
     * Get all calendar syncs for a user (academic calendars with their sync status)
     */
    static async getCalendarSyncsForUser(userId: string) {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Ensure every calendar has a CalendarSync entry for this user.
        // Uses a single query to find missing ones instead of N individual lookups.
        const [allCalendars, existingSyncs] = await Promise.all([
            calendarRepo.find(),
            syncRepo.find({ where: { userId }, select: ['calendarId'] })
        ]);

        const existingCalendarIds = new Set(existingSyncs.map(s => s.calendarId));
        const missing = allCalendars.filter(c => !existingCalendarIds.has(c.id));

        if (missing.length > 0) {
            await syncRepo.save(
                missing.map(calendar => syncRepo.create({ userId, calendarId: calendar.id, syncStatus: SyncStatus.IDLE }))
            );
        }

        return await syncRepo.find({
            where: { userId },
            relations: ['calendar', 'calendar.course', 'calendar.course.degree'],
            order: {
                calendar: {
                    course: { startYear: 'DESC' },
                    semester: 'ASC'
                }
            }
        });
    }

    /**
     * Delete a single CalendarSync: marks as DELETING, cleans up Google Calendar events, then removes from DB
     */
    static async deleteSingleSync(syncId: string, userId: string, accessToken?: string): Promise<boolean> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        const sync = await syncRepo.findOne({
            where: { id: syncId, userId },
            relations: ['calendar']
        });
        if (!sync) return false;

        sync.syncStatus = SyncStatus.DELETING;
        sync.currentOperation = 'Eliminando sincronización...';
        await syncRepo.save(sync);

        if (accessToken) {
            try {
                await this.cleanupCalendarEvents(sync.calendar.id, sync.userId, accessToken);
            } catch (error) {
                console.error('[DELETE SYNC] Error cleaning up calendar events:', error);
            }
        }

        await syncRepo.remove(sync);
        return true;
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
                await this.waitForRateLimit();
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

                const { toDelete: eventsToDelete, toKeep: eventsToKeep } = allEvents.reduce(
                    (acc: { toDelete: any[]; toKeep: any[] }, event: any) => {
                        const calId = event.extendedProperties?.private?.academicCalendarId;
                        if (calId === academicCalendarId) acc.toDelete.push(event);
                        else if (calId) acc.toKeep.push(event);
                        return acc;
                    },
                    { toDelete: [], toKeep: [] }
                );

                console.log(`[CLEANUP] Calendar ${googleCal.classroom.code}: ${allEvents.length} total, ${eventsToDelete.length} to delete, ${eventsToKeep.length} to keep`);

                // Delete events — each call goes through waitForRateLimit so the widget reflects real usage
                for (const event of eventsToDelete) {
                    try {
                        await this.waitForRateLimit();
                        const deleteResponse = await fetch(
                            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCal.googleCalendarId)}/events/${event.id}`,
                            {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${accessToken}` }
                            }
                        );
                        if (!deleteResponse.ok && deleteResponse.status !== 404) {
                            console.warn(`[CLEANUP] Failed to delete event ${event.id}: ${deleteResponse.status}`);
                        }
                    } catch (error) {
                        console.error(`[CLEANUP] Error deleting event ${event.id}:`, error);
                    }
                }

                // If no events remain from other calendars, delete the entire Google Calendar.
                // Reuses deleteGoogleCalendar which already handles waitForRateLimit.
                if (eventsToKeep.length === 0) {
                    console.log(`[CLEANUP] Calendar ${googleCal.classroom.code} is now empty, deleting it...`);
                    await this.deleteGoogleCalendar(accessToken, googleCal.googleCalendarId);
                    // Always remove from DB — if Google returns 404 the calendar is already gone
                    await googleCalendarRepo.remove(googleCal);
                    console.log(`[CLEANUP] Deleted Google Calendar ${googleCal.classroom.code}`);
                }
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

            // Create Google Calendars for missing classrooms (on-demand).
            // On a retry run, restrict to the IDs that previously failed to avoid duplicates.
            const classroomRepo = AppDataSource.getRepository(Classroom);
            const pendingIds: string[] | null = sync.pendingClassroomIds
                ? (JSON.parse(sync.pendingClassroomIds) as string[])
                : null;
            const classroomsToCreate = pendingIds
                ?? Array.from(neededClassrooms).filter(id => !classroomToGoogleCal[id]);

            if (classroomsToCreate.length > 0) {
                console.log(`[SYNC] Need to create ${classroomsToCreate.length} new Google Calendars`);

                sync.totalCalendars = classroomsToCreate.length;
                sync.processedCalendars = 0;
                sync.currentOperation = `Creando ${classroomsToCreate.length} calendarios nuevos...`;
                await syncRepo.save(sync);

                let createdCount = 0;
                // Store both ID (for retry) and code (for user-facing messages)
                const failedClassroomIds: string[] = [];
                const failedClassroomCodes: string[] = [];
                let lastErrorCode = '';

                for (const classroomId of classroomsToCreate) {
                    const classroom = await classroomRepo.findOne({ where: { id: classroomId } });
                    if (!classroom) continue;

                    createdCount++;
                    sync.processedCalendars = createdCount;
                    sync.currentOperation = `Creando calendario ${createdCount}/${classroomsToCreate.length}: ${classroom.code}`;
                    await syncRepo.save(sync);

                    try {
                        const googleCal = await this.ensureGoogleCalendarForClassroom(
                            sync.userId,
                            classroomId,
                            classroom.code,
                            accessToken,
                            sync.createdBy || 'system'
                        );
                        classroomToGoogleCal[classroomId] = googleCal.googleCalendarId;
                        console.log(`[SYNC] Created Google Calendar for classroom ${classroom.code}`);
                    } catch (err: unknown) {
                        const errorCode = err instanceof Error ? err.message : String(err);
                        lastErrorCode = errorCode;
                        failedClassroomIds.push(classroomId);
                        failedClassroomCodes.push(classroom.code);
                        console.error(`[SYNC] Failed to create Google Calendar for classroom ${classroom.code}:`, errorCode);

                        if (errorCode.includes('GOOGLE_TOKEN_EXPIRED')) {
                            throw new Error(`${GOOGLE_ERROR_PREFIX}GOOGLE_TOKEN_EXPIRED`);
                        }
                    }
                }

                const successCount = createdCount - failedClassroomIds.length;
                console.log(`[SYNC] Created ${successCount} new Google Calendars (${failedClassroomIds.length} failed)`);

                if (failedClassroomIds.length > 0) {
                    if (isRetryableErrorCode(lastErrorCode) && sync.retryCount < GoogleCalendarService.MAX_RETRIES) {
                        const delayMs = GoogleCalendarService.RETRY_DELAYS_MS[sync.retryCount] ?? GoogleCalendarService.RETRY_DELAYS_MS[GoogleCalendarService.RETRY_DELAYS_MS.length - 1];
                        const retryIn = Math.round(delayMs / 60_000);
                        const partialParams = JSON.stringify({
                            created: successCount,
                            failed: failedClassroomIds.length,
                            classrooms: failedClassroomCodes.join(', ')
                        });
                        sync.syncStatus = SyncStatus.PENDING_RETRY;
                        sync.pendingClassroomIds = JSON.stringify(failedClassroomIds);
                        sync.nextRetryAt = new Date(Date.now() + delayMs);
                        sync.retryCount = sync.retryCount + 1;
                        sync.errorMessage = successCount === 0
                            ? lastErrorCode
                            : `${GOOGLE_ERROR_PREFIX}GOOGLE_CALENDAR_PARTIAL:${partialParams}`;
                        sync.currentOperation = `Esperando cuota de Google (intento ${sync.retryCount}/${GoogleCalendarService.MAX_RETRIES}). Reintentando en ${retryIn} min...`;
                        sync.totalCalendars = undefined;
                        sync.processedCalendars = undefined;
                        await syncRepo.save(sync);
                        console.log(`[SYNC] Scheduled retry ${sync.retryCount}/${GoogleCalendarService.MAX_RETRIES} for sync ${syncId} in ${retryIn} min`);
                        return { success: true, message: 'pending_retry' };
                    }

                    // Non-retryable error or retries exhausted — fall through to throw
                    const params = JSON.stringify({
                        created: successCount,
                        failed: failedClassroomIds.length,
                        classrooms: failedClassroomCodes.join(', ')
                    });
                    const isStructuredError = lastErrorCode.startsWith(GOOGLE_ERROR_PREFIX);
                    if (successCount === 0 && isStructuredError) {
                        throw new Error(lastErrorCode);
                    }
                    throw new Error(`${GOOGLE_ERROR_PREFIX}GOOGLE_CALENDAR_PARTIAL:${params}`);
                }
            } else {
                console.log(`[SYNC] All needed Google Calendars already exist`);
            }

            // Clear retry state now that all calendars are in place
            sync.pendingClassroomIds = undefined;
            sync.retryCount = 0;
            sync.nextRetryAt = undefined;
            sync.errorMessage = undefined;

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
            sync.errorMessage = undefined;
            sync.totalCalendars = undefined;
            sync.processedCalendars = undefined;
            sync.currentOperation = undefined;
            await syncRepo.save(sync);

            return {
                success: true,
                message: `Calendar synced successfully (${eventsProcessed} event placements)`
            };
        } catch (error: any) {
            // Update status to error - clear progress fields
            sync.syncStatus = SyncStatus.ERROR;
            sync.errorMessage = error.message || 'Unknown error during sync';
            sync.totalCalendars = undefined;
            sync.processedCalendars = undefined;
            sync.currentOperation = undefined;
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

        // Diagnostic: log all distinct userIds present in both tables
        const syncUserIds = await syncRepo
            .createQueryBuilder('sync')
            .select('DISTINCT sync.userId', 'userId')
            .getRawMany<{ userId: string }>();
        const gcalUserIds = await googleCalendarRepo
            .createQueryBuilder('gcal')
            .select('DISTINCT gcal.userId', 'userId')
            .getRawMany<{ userId: string }>();
        console.log(`[DELETE ALL USER SYNCS] UserIds in CALENDAR_SYNCS:`, syncUserIds.map(r => r.userId));
        console.log(`[DELETE ALL USER SYNCS] UserIds in GOOGLE_CLASSROOM_CALENDARS:`, gcalUserIds.map(r => r.userId));

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
    ): Promise<GoogleCalendarCreateResponse> {
        await this.waitForRateLimit();
        await new Promise(resolve => setTimeout(resolve, this.CALENDAR_CREATION_DELAY_MS));

        let response: Response;
        try {
            response = await fetch(`${this.GOOGLE_CALENDAR_API}/calendars`, {
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
        } catch (networkError) {
            console.error('Network error creating Google Calendar:', networkError);
            throw new Error(`${GOOGLE_ERROR_PREFIX}GOOGLE_NETWORK_ERROR`);
        }

        if (!response.ok) {
            const body = await response.text();
            console.error(`Failed to create Google Calendar [${response.status}]:`, body);
            throw new Error(buildGoogleErrorCode(response.status, body));
        }

        this.dailyCalendarCreations++;
        this.persistQuotaCounters();
        return response.json() as Promise<GoogleCalendarCreateResponse>;
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
                    const body = await response.text();
                    console.error(`Event insert failed (${i + 1}/${events.length}) [${response.status}]:`, body);
                    if (response.status === 401) {
                        throw new Error(`${GOOGLE_ERROR_PREFIX}GOOGLE_TOKEN_EXPIRED`);
                    }
                }
            } catch (err) {
                // Re-throw structured errors (e.g. 401 abort) so the caller can handle them
                if (err instanceof Error && err.message.startsWith(GOOGLE_ERROR_PREFIX)) throw err;
                console.error(`Event insert network error (${i + 1}/${events.length}):`, err);
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
                const body = await listResponse.text();
                console.error(`Failed to list events [${listResponse.status}]:`, body);
                if (listResponse.status === 401) {
                    throw new Error(`${GOOGLE_ERROR_PREFIX}GOOGLE_TOKEN_EXPIRED`);
                }
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

    /**
     * Called at server startup to reset any syncs that were left in SYNCING state
     * due to a crash or unexpected restart, preventing them from being stuck forever.
     */
    static async recoverStuckSyncs(): Promise<void> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const stuck = await syncRepo.find({ where: { syncStatus: SyncStatus.SYNCING } });
        if (stuck.length === 0) return;

        for (const sync of stuck) {
            sync.syncStatus = SyncStatus.ERROR;
            sync.errorMessage = `${GOOGLE_ERROR_PREFIX}SYNC_INTERRUPTED`;
            sync.currentOperation = undefined;
            sync.totalCalendars = undefined;
            sync.processedCalendars = undefined;
            await syncRepo.save(sync);
        }
        console.log(`[CRASH RECOVERY] Reset ${stuck.length} stuck sync(s) to ERROR`);
    }

    /**
     * Periodic job: retries calendar creation for syncs in PENDING_RETRY state
     * whose nextRetryAt has elapsed. Called every 60s from index.ts.
     */
    static async processPendingRetries(): Promise<void> {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth_service:5003';

        const due = await syncRepo
            .createQueryBuilder('sync')
            .where('sync.syncStatus = :status', { status: SyncStatus.PENDING_RETRY })
            .andWhere('sync.nextRetryAt <= :now', { now: new Date() })
            .getMany();

        if (due.length === 0) return;

        console.log(`[RETRY JOB] Processing ${due.length} pending retry(s)`);

        for (const sync of due) {
            let accessToken: string | undefined;
            try {
                const tokenRes = await fetch(`${authServiceUrl}/auth/google/token/${sync.userId}`, {
                    headers: { 'X-Internal-Service': 'planner_service' }
                });
                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json() as { success: boolean; data?: { accessToken?: string } };
                    accessToken = tokenData.success ? tokenData.data?.accessToken : undefined;
                }
            } catch (err) {
                console.error(`[RETRY JOB] Failed to fetch access token for user ${sync.userId}:`, err);
            }

            if (!accessToken) {
                sync.syncStatus = SyncStatus.ERROR;
                sync.errorMessage = `${GOOGLE_ERROR_PREFIX}GOOGLE_TOKEN_EXPIRED`;
                sync.currentOperation = undefined;
                sync.pendingClassroomIds = undefined;
                sync.nextRetryAt = undefined;
                await syncRepo.save(sync);
                console.log(`[RETRY JOB] No access token for sync ${sync.id} — marked as ERROR`);
                continue;
            }

            console.log(`[RETRY JOB] Retrying sync ${sync.id} (attempt ${sync.retryCount}/${this.MAX_RETRIES})`);
            await this.syncCalendarToGoogle(sync.id, accessToken);
        }
    }
}
