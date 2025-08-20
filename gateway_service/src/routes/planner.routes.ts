import express from 'express';
import { getDegrees, getCourses, getCoursesByDegreeId, getCoursesByDegreeAcronym, getSubjects, getSubjectsByDegreeId, getSubjectsWithEventsAndGroupsByCourseAndSemester, getClassrooms, createClassroom, deleteClassroom } from '@/controllers/planner.controller';

const router = express.Router();

router.get('/degrees', getDegrees);

router.get('/courses', getCourses);

router.get('/subjects', getSubjects);

router.get('/classrooms', getClassrooms);

router.post('/classroom', createClassroom);

router.delete('/classroom/:id', deleteClassroom);

router.get('/courses/degree/:id', getCoursesByDegreeId);

router.get('/courses/degree/:acronym', getCoursesByDegreeAcronym);

router.get('/subjects/degree/:id', getSubjectsByDegreeId);

router.get('/subjects/with-events/groups/by-course/:courseId/semester/:semester', getSubjectsWithEventsAndGroupsByCourseAndSemester);



export default router;
