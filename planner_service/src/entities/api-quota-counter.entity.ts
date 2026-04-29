import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Global API quota counters — one row per API key (e.g. 'google_calendar').
 * Persists across server restarts so usage tracking survives deploys.
 * bigint columns store millisecond timestamps.
 */
@Entity('API_QUOTA_COUNTERS')
export class ApiQuotaCounter {
    @PrimaryColumn('varchar', { name: 'API_KEY', length: 64 })
    apiKey!: string;

    @Column('int', { name: 'MINUTE_COUNT', default: 0 })
    minuteCount!: number;

    @Column('bigint', { name: 'MINUTE_WINDOW_START', default: 0 })
    minuteWindowStart!: number;

    @Column('int', { name: 'DAILY_COUNT', default: 0 })
    dailyCount!: number;

    @Column('int', { name: 'DAILY_CALENDAR_CREATIONS', default: 0 })
    dailyCalendarCreations!: number;

    @Column('bigint', { name: 'DAILY_WINDOW_START', default: 0 })
    dailyWindowStart!: number;
}
