import { AppDataSource } from '@/config/data-source';
import { CalendarSync, SyncStatus } from '@/entities/calendar-sync.entity';
import { GoogleCalendarService } from '@/services/google-calendar.service';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth_service:3001';

interface TokenResponse {
    success: boolean;
    data?: {
        accessToken: string;
    };
    message?: string;
}

/**
 * Get valid access token for a user from auth_service
 */
async function getAccessTokenForUser(userId: string): Promise<string | null> {
    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/auth/google/token/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Service': 'planner_service'
            }
        });

        if (!response.ok) {
            console.warn(`Failed to get token for user ${userId}: ${response.status}`);
            return null;
        }

        const data: TokenResponse = await response.json();
        return data.success ? data.data?.accessToken || null : null;
    } catch (error) {
        console.error(`Error getting token for user ${userId}:`, error);
        return null;
    }
}

/**
 * Run calendar sync for all enabled syncs
 */
async function runCalendarSync(): Promise<void> {
    console.log('[CalendarSync] Starting sync job...');

    try {
        const syncRepo = AppDataSource.getRepository(CalendarSync);

        // Get all enabled syncs that are not currently syncing
        const syncsToProcess = await syncRepo.find({
            where: {
                syncEnabled: true,
                syncStatus: SyncStatus.IDLE
            },
            relations: ['calendar']
        });

        if (syncsToProcess.length === 0) {
            console.log('[CalendarSync] No calendars to sync');
            return;
        }

        console.log(`[CalendarSync] Found ${syncsToProcess.length} calendars to sync`);

        // Group syncs by user for token efficiency
        const syncsByUser = new Map<string, CalendarSync[]>();
        for (const sync of syncsToProcess) {
            const userSyncs = syncsByUser.get(sync.userId) || [];
            userSyncs.push(sync);
            syncsByUser.set(sync.userId, userSyncs);
        }

        // Process each user's syncs
        for (const [userId, userSyncs] of syncsByUser) {
            const accessToken = await getAccessTokenForUser(userId);

            if (!accessToken) {
                console.warn(`[CalendarSync] Could not get access token for user ${userId}, skipping ${userSyncs.length} syncs`);

                // Mark syncs as error due to missing token
                for (const sync of userSyncs) {
                    sync.syncStatus = SyncStatus.ERROR;
                    sync.errorMessage = 'Could not obtain Google access token. Please reconnect your Google account.';
                    await syncRepo.save(sync);
                }
                continue;
            }

            // Sync each calendar for this user
            for (const sync of userSyncs) {
                try {
                    const result = await GoogleCalendarService.syncCalendarToGoogle(sync.id, accessToken);
                    console.log(`[CalendarSync] Sync ${sync.id}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
                } catch (error: any) {
                    console.error(`[CalendarSync] Error syncing calendar ${sync.id}:`, error);
                    sync.syncStatus = SyncStatus.ERROR;
                    sync.errorMessage = error.message || 'Unknown error';
                    await syncRepo.save(sync);
                }
            }
        }

        console.log('[CalendarSync] Sync job completed');
    } catch (error) {
        console.error('[CalendarSync] Critical error in sync job:', error);
    }
}

/**
 * Reset stuck syncs (syncs that have been in SYNCING state for too long)
 */
async function resetStuckSyncs(): Promise<void> {
    try {
        const syncRepo = AppDataSource.getRepository(CalendarSync);
        const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes

        const stuckSyncs = await syncRepo
            .createQueryBuilder('sync')
            .where('sync.syncStatus = :status', { status: SyncStatus.SYNCING })
            .andWhere('sync.updatedAt < :threshold', { threshold: stuckThreshold })
            .getMany();

        for (const sync of stuckSyncs) {
            console.warn(`[CalendarSync] Resetting stuck sync: ${sync.id}`);
            sync.syncStatus = SyncStatus.IDLE;
            sync.errorMessage = 'Sync was reset after being stuck';
            await syncRepo.save(sync);
        }
    } catch (error) {
        console.error('[CalendarSync] Error resetting stuck syncs:', error);
    }
}

let syncIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the calendar sync job
 */
export function startCalendarSyncJob(): void {
    if (syncIntervalId) {
        console.warn('[CalendarSync] Job already running');
        return;
    }

    console.log(`[CalendarSync] Starting sync job with interval of ${SYNC_INTERVAL_MS / 1000} seconds`);

    // Run initial sync after 30 seconds to allow services to initialize
    setTimeout(async () => {
        await resetStuckSyncs();
        await runCalendarSync();
    }, 30000);

    // Then run every 5 minutes
    syncIntervalId = setInterval(async () => {
        await resetStuckSyncs();
        await runCalendarSync();
    }, SYNC_INTERVAL_MS);
}

/**
 * Stop the calendar sync job
 */
export function stopCalendarSyncJob(): void {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        console.log('[CalendarSync] Job stopped');
    }
}

/**
 * Trigger an immediate sync for a specific calendar
 */
export async function triggerImmediateSync(calendarSyncId: string, accessToken: string): Promise<{ success: boolean; message: string }> {
    return GoogleCalendarService.syncCalendarToGoogle(calendarSyncId, accessToken);
}
