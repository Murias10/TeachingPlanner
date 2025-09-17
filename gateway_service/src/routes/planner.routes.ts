import express from 'express';
import { getDegrees, getCourses, getCoursesByDegreeId, getCoursesByDegreeAcronym, getSubjects, getSubjectsByDegreeId, getSubjectsWithEventsAndGroupsByCourseAndSemester, getClassrooms, createClassroom, deleteClassroom, createDegree, deleteDegree, deleteSubject, createSubject, deleteCourse, deleteCalendar, getDegreeByAcronym, createCourse, createCalendar, getCalendarById } from '@/controllers/planner.controller';

const router = express.Router();

router.get('/degrees', getDegrees);

router.get('/degree/acronym/:acronym', getDegreeByAcronym);

router.post('/degree', createDegree)

router.delete('/degree/:id', deleteDegree)

//////////////////////////////////////////////

router.get('/subjects', getSubjects);

router.get('/subjects/degree/:id', getSubjectsByDegreeId);

router.get('/subjects/with-events/groups/by-course/:courseId/semester/:semester', getSubjectsWithEventsAndGroupsByCourseAndSemester);

router.post('/subject', createSubject);

router.delete('/subject/:id', deleteSubject)

//////////////////////////////////////////////

router.get('/classrooms', getClassrooms);

router.post('/classroom', createClassroom);

router.delete('/classroom/:id', deleteClassroom);

//////////////////////////////////////////////

router.get('/courses', getCourses);

router.get('/courses/degree/:id', getCoursesByDegreeId);

router.get('/courses/degree/acronym/:acronym', getCoursesByDegreeAcronym);

router.post('/course', createCourse);

router.delete('/course/:id', deleteCourse)

//////////////////////////////////////////////

router.get('/calendar/:id', getCalendarById);

router.post('/calendar', createCalendar);

router.delete('/calendar/:id', deleteCalendar)

export default router;