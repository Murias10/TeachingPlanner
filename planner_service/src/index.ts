import app from '@/app';
import { connectToPlannerDatabase } from '@/config/data-source';
import { GoogleCalendarService } from '@/services/google-calendar.service';
import degreeRouter from '@/routes/degree.routes';
import courseRouter from '@/routes/course.routes';
import classroomRouter from '@/routes/classrooms.routes';
import subjectRouter from '@/routes/subject.routes';
import calendarRouter from '@/routes/calendar.routes';
import eventRequestRouter from '@/routes/event-request.routes';
import calendarSyncRouter from '@/routes/calendar-sync.routes';
import groupRouter from '@/routes/group.routes';
import testRouter from '@/routes/test.routes';

const port = process.env.PLANNER_SERVICE_PORT;

const startServer = async () => {
    await connectToPlannerDatabase();
    await GoogleCalendarService.initQuotaCounters();
    await GoogleCalendarService.recoverStuckSyncs();

    // Retry pending calendar creations every 60 seconds
    setInterval(() => {
        GoogleCalendarService.processPendingRetries()
            .catch(err => console.error('[RETRY JOB] Unhandled error:', err));
    }, 60_000);

    app.use(degreeRouter);
    app.use(courseRouter);
    app.use(classroomRouter);
    app.use(subjectRouter);
    app.use(calendarRouter);
    app.use(eventRequestRouter);
    app.use(calendarSyncRouter);
    app.use(groupRouter);
    app.use(testRouter);

    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 App listening on port ${port}`);
    });
};

startServer();
