import { NextFunction, Request, Response } from 'express';
import FormData from 'form-data';
import axios from 'axios';
import { proxyRequest, proxyBinaryRequest, getProxyHeaders } from '@/utils/proxy';
import { SERVICES } from '@/config/services';


export const getDegrees = (_req: Request, res: Response, next: NextFunction) =>
    proxyRequest(_req, res, next, {
        url: `${SERVICES.PLANNER}/degrees`,
        method: 'GET'
    });

export const getDegreeByAcronym = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/degree/acronym/${req.params.acronym}`,
        method: 'GET'
    });

export const createDegree = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/degree`,
        method: "POST",
        body: req.body
    });

export const updateDegree = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/degree/${req.params.id}`,
        method: "PATCH",
        body: req.body
    });

export const deleteDegree = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/degree/${req.params.id}`,
        method: "DELETE"
    });

export const getSubjects = (_req: Request, res: Response, next: NextFunction) =>
    proxyRequest(_req, res, next, {
        url: `${SERVICES.PLANNER}/subjects`,
        method: 'GET'
    });

export const getSubjectsByDegreeId = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/subjects/degree/${req.params.id}`,
        method: 'GET'
    });

export const getSubjectsWithEventsAndGroupsByCourseAndSemester = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/subjects/groups/by-course/${req.params.courseId}/semester/${req.params.semester}`,
        method: 'GET'
    });

export const deleteSubject = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/subject/${req.params.id}`,
        method: "DELETE"
    });

export const createSubject = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/subject`,
        method: "POST",
        body: req.body
    });

export const updateSubject = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/subject/${req.params.id}`,
        method: "PATCH",
        body: req.body
    });


export const getCourses = (_req: Request, res: Response, next: NextFunction) =>
    proxyRequest(_req, res, next, {
        url: `${SERVICES.PLANNER}/courses`,
        method: 'GET'
    });

export const getCoursesByDegreeId = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/courses/degree/${req.params.id}`,
        method: 'GET'
    });

export const getCoursesByDegreeAcronym = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/courses/degree/acronym/${req.params.acronym}`,
        method: 'GET'
    });

export const createCourse = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/course`,
        method: "POST",
        body: req.body
    });

export const updateCourse = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/course/${req.params.id}`,
        method: "PATCH",
        body: req.body
    });

export const deleteCourse = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/course/${req.params.id}`,
        method: "DELETE"
    });

export const getClassrooms = (_req: Request, res: Response, next: NextFunction) =>
    proxyRequest(_req, res, next, {
        url: `${SERVICES.PLANNER}/classrooms`,
        method: 'GET'
    });

export const createClassroom = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/classroom`,
        method: "POST",
        body: req.body
    });

export const updateClassroom = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/classroom/${req.params.id}`,
        method: "PATCH",
        body: req.body
    });

export const deleteClassroom = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/classroom/${req.params.id}`,
        method: "DELETE"
    });

export const createCalendar = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar`,
        method: "POST",
        body: req.body
    });

export const createCalendarWithImport = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const { courseId, semester } = req.body;

        console.log('courseId:', courseId);
        console.log('semester:', semester);
        console.log('files received:', files?.length);

        // Crear FormData para reenviar al planner service
        const formData = new FormData();
        formData.append('courseId', courseId);
        formData.append('semester', semester);

        // Agregar archivos
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append('files', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype,
                });
            });
        }

        console.log('Forwarding to planner service...');

        // Usar axios para reenviar correctamente
        const headers = getProxyHeaders(req, formData.getHeaders());
        const response = await axios.post(
            `${SERVICES.PLANNER}/calendar/import`,
            formData,
            {
                headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        console.log('Planner service responded successfully');
        res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Error forwarding to planner service:', error);

        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Error connecting to planner service',
                data: error instanceof Error ? error.message : error
            });
        }
    }
};

export const importExceptions = async (req: Request, res: Response) => {
    try {
        const { calendarId } = req.params;
        const file = req.file as Express.Multer.File;

        if (!file) {
            res.status(400).json({
                status: 'error',
                message: 'File is required',
                data: null
            });
            return;
        }

        // Crear FormData para reenviar al planner service
        const formData = new FormData();
        formData.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });

        // Usar axios para reenviar correctamente
        const headers = getProxyHeaders(req, formData.getHeaders());
        const response = await axios.post(
            `${SERVICES.PLANNER}/calendar/${calendarId}/import-exceptions`,
            formData,
            {
                headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Error importing exceptions:', error);

        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Error connecting to planner service',
                data: error instanceof Error ? error.message : error
            });
        }
    }
};


export const getCalendarById = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/${req.params.id}`,
        method: 'GET'
    });

export const deleteCalendar = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/${req.params.id}`,
        method: "DELETE"
    });

export const getCalendarEvents = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/${req.params.id}/events`,
        method: 'GET'
    });

export const getPendingRequestsAsEvents = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/${req.params.id}/pending-requests`,
        method: 'GET'
    });

export const exportCalendar = (req: Request, res: Response, next: NextFunction) =>
    proxyBinaryRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/${req.params.id}/export`,
        method: 'GET'
    });

export const createPuntualEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/puntual-event`,
        method: 'POST',
        body: req.body
    });

export const updatePuntualEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/puntual-event/${req.params.eventId}`,
        method: 'PUT',
        body: req.body
    });

export const createPeriodicEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/periodic-event`,
        method: 'POST',
        body: req.body
    });

export const createCustomPeriodicEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/custom-periodic-event`,
        method: 'POST',
        body: req.body
    });

export const updatePeriodicEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/periodic-event/${req.params.eventId}`,
        method: 'PUT',
        body: req.body
    });

export const updateCustomPeriodicEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/custom-periodic-event`,
        method: 'PUT',
        body: req.body
    });

export const replacePeriodicEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/replace-event`,
        method: 'POST',
        body: req.body
    });

export const deletePuntualEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/puntual-event/${req.params.eventId}`,
        method: 'DELETE'
    });

export const deletePeriodicEvent = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar/periodic-event/${req.params.eventId}`,
        method: 'DELETE'
    });
// ============================================
// Event Request Controllers (Proxy to planner_service)
// ============================================

export const createEventRequest = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/event-request`,
        method: 'POST',
        body: req.body
    });

export const getEventRequests = (req: Request, res: Response, next: NextFunction) => {
    const query = new URLSearchParams(req.query as Record<string, string>).toString();
    return proxyRequest(req, res, next, {
        url: query ? `${SERVICES.PLANNER}/event-requests?${query}` : `${SERVICES.PLANNER}/event-requests`,
        method: 'GET'
    });
};

export const getEventRequestById = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/event-request/${req.params.id}`,
        method: 'GET'
    });

export const approveEventRequest = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/event-request/${req.params.id}/approve`,
        method: 'PATCH',
        body: req.body
    });

export const rejectEventRequest = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/event-request/${req.params.id}/reject`,
        method: 'PATCH',
        body: req.body
    });

export const deleteEventRequest = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/event-request/${req.params.id}`,
        method: 'DELETE'
    });

//////////////////////////////////////////////
// GROUP ENDPOINTS
//////////////////////////////////////////////

export const createGroup = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/group`,
        method: 'POST',
        body: req.body
    });

export const deleteGroup = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/group/${req.params.id}`,
        method: 'DELETE'
    });

export const updateGroupPlanifiedHours = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/group/${req.params.id}/planified-hours`,
        method: 'PATCH',
        body: req.body
    });
