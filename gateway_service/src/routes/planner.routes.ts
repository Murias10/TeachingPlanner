import express from 'express';
import multer from 'multer';
import { getDegrees, getDegreesWithActiveCalendars, getCourses, getCoursesByDegreeId, getCoursesByDegreeAcronym, getSubjects, getSubjectsByDegreeId, getSubjectsWithEventsAndGroupsByCourseAndSemester, getClassrooms, createClassroom, deleteClassroom, updateClassroom, createDegree, deleteDegree, deleteSubject, createSubject, updateSubject, deleteCourse, deleteCalendar, getDegreeByAcronym, createCourse, createCalendar, getCalendarById, createCalendarWithImport, importExceptions, getCalendarEvents, getPendingRequestsAsEvents, exportCalendar, updateCourse, updateDegree, createPuntualEvent, updatePuntualEvent, createPeriodicEvent, createCustomPeriodicEvent, updatePeriodicEvent, updateCustomPeriodicEvent, replacePeriodicEvent, deletePuntualEvent, deletePeriodicEvent, createEventRequest, getEventRequests, getEventRequestById, approveEventRequest, rejectEventRequest, deleteEventRequest, createGroup, deleteGroup, updateGroupPlanifiedHours } from '@/controllers/planner.controller';

// Configurar multer para el gateway
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.originalname.endsWith('.txt')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB límite
    }
});

const router = express.Router();

router.get('/degrees', getDegrees);

router.get('/degrees/with-active-calendars', getDegreesWithActiveCalendars);

router.get('/degree/acronym/:acronym', getDegreeByAcronym);

router.post('/degree', createDegree)

router.patch('/degree/:id', updateDegree)

router.delete('/degree/:id', deleteDegree)

//////////////////////////////////////////////

router.get('/subjects', getSubjects);

router.get('/subjects/degree/:id', getSubjectsByDegreeId);

router.get('/subjects/groups/by-course/:courseId/semester/:semester', getSubjectsWithEventsAndGroupsByCourseAndSemester);

router.post('/subject', createSubject);

router.patch('/subject/:id', updateSubject);

router.delete('/subject/:id', deleteSubject)

//////////////////////////////////////////////

router.get('/classrooms', getClassrooms);

router.post('/classroom', createClassroom);

router.patch('/classroom/:id', updateClassroom);

router.delete('/classroom/:id', deleteClassroom);

//////////////////////////////////////////////

router.get('/courses', getCourses);

router.get('/courses/degree/acronym/:acronym', getCoursesByDegreeAcronym);

router.get('/courses/degree/:id', getCoursesByDegreeId);

router.post('/course', createCourse);

router.patch('/course/:id', updateCourse);

router.delete('/course/:id', deleteCourse)

//////////////////////////////////////////////

router.get('/calendar/:id', getCalendarById);

router.post('/calendar', createCalendar);

router.post('/calendar/import', upload.array('files', 10), createCalendarWithImport);

router.post('/calendar/:calendarId/import-exceptions', upload.single('file'), importExceptions);

router.post('/calendar/puntual-event', createPuntualEvent);

router.put('/calendar/puntual-event/:eventId', updatePuntualEvent);

router.post('/calendar/periodic-event', createPeriodicEvent);

router.post('/calendar/custom-periodic-event', createCustomPeriodicEvent);

router.put('/calendar/periodic-event/:eventId', updatePeriodicEvent);

router.put('/calendar/custom-periodic-event', updateCustomPeriodicEvent);

router.post('/calendar/replace-event', replacePeriodicEvent);

router.delete('/calendar/puntual-event/:eventId', deletePuntualEvent);

router.delete('/calendar/periodic-event/:eventId', deletePeriodicEvent);

router.get('/calendar/:id/events', getCalendarEvents);

router.get('/calendar/:id/pending-requests', getPendingRequestsAsEvents);

router.get('/calendar/:id/export', exportCalendar);

router.delete('/calendar/:id', deleteCalendar)

//////////////////////////////////////////////

router.post('/event-request', createEventRequest);

router.get('/event-requests', getEventRequests);

router.get('/event-request/:id', getEventRequestById);

router.patch('/event-request/:id/approve', approveEventRequest);

router.patch('/event-request/:id/reject', rejectEventRequest);

router.delete('/event-request/:id', deleteEventRequest);

//////////////////////////////////////////////

router.post('/group', createGroup);

router.delete('/group/:id', deleteGroup);

router.patch('/group/:id/planified-hours', updateGroupPlanifiedHours);

export default router;
