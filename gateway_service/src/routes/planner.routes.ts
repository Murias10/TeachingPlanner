import express from 'express';
import multer from 'multer';
import { getDegrees, getCourses, getCoursesByDegreeId, getCoursesByDegreeAcronym, getSubjects, getSubjectsByDegreeId, getSubjectsWithEventsAndGroupsByCourseAndSemester, getClassrooms, createClassroom, deleteClassroom, updateClassroom, createDegree, deleteDegree, deleteSubject, createSubject, updateSubject, deleteCourse, deleteCalendar, getDegreeByAcronym, createCourse, createCalendar, getCalendarById, createCalendarWithImport, getCalendarEvents, exportCalendar, updateCourse, updateDegree } from '@/controllers/planner.controller';

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

router.get('/degree/acronym/:acronym', getDegreeByAcronym);

router.post('/degree', createDegree)

router.patch('/degree/:id', updateDegree)

router.delete('/degree/:id', deleteDegree)

//////////////////////////////////////////////

router.get('/subjects', getSubjects);

router.get('/subjects/degree/:id', getSubjectsByDegreeId);

router.get('/subjects/with-events/groups/by-course/:courseId/semester/:semester', getSubjectsWithEventsAndGroupsByCourseAndSemester);

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

router.get('/courses/degree/:id', getCoursesByDegreeId);

router.get('/courses/degree/acronym/:acronym', getCoursesByDegreeAcronym);

router.post('/course', createCourse);

router.patch('/course/:id', updateCourse);

router.delete('/course/:id', deleteCourse)

//////////////////////////////////////////////

router.get('/calendar/:id', getCalendarById);

router.post('/calendar', createCalendar);

router.post('/calendar/import', upload.array('files', 10), createCalendarWithImport);

router.get('/calendar/:id/events', getCalendarEvents);

router.get('/calendar/:id/export', exportCalendar);

router.delete('/calendar/:id', deleteCalendar)

export default router;