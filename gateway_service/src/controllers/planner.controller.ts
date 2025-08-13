import { NextFunction, Request, Response } from 'express';

export const getDegrees = (_req: Request, res: Response, next: NextFunction) => {
    fetch('http://planner_service:5001/degrees')
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}

export const getSubjects = (_req: Request, res: Response, next: NextFunction) => {
    fetch('http://planner_service:5001/subjects')
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}

export const getSubjectsByDegreeId = (req: Request, res: Response, next: NextFunction) => {
    const degreeId = req.params.id;
    fetch(`http://planner_service:5001/subjects/degree/${degreeId}`)
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}


export const getSubjectsWithEventsAndGroupsByCourseAndSemester = (req: Request, res: Response, next: NextFunction) => {
    const { courseId, semester } = req.params;
    fetch(`http://planner_service:5001/subjects/with-events/groups/by-course/${courseId}/semester/${semester}`)
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}


export const getClassrooms = (_req: Request, res: Response, next: NextFunction) => {
    fetch('http://planner_service:5001/classrooms')
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}


export const getCourses = (_req: Request, res: Response, next: NextFunction) => {
    fetch('http://planner_service:5001/courses')
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}


export const getCoursesByDegreeId = (req: Request, res: Response, next: NextFunction) => {
    const degreeId = req.params.id;
    fetch(`http://planner_service:5001/courses/degree/${degreeId}`)
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}

export const getCoursesByDegreeAcronym = (req: Request, res: Response, next: NextFunction) => {
    const degreeAcronym = req.params.acronym.toLowerCase();
    fetch(`http://planner_service:5001/courses/degree/${degreeAcronym}`)
        .then(async (response) => {
            // Copia los headers del planner service
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Obtén el body como JSON
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
}

export const createClassroom = async (req: Request, res: Response, next: NextFunction) => {

    const { code, gisUrl } = req.body; // ✅ se recibe desde body

    fetch("http://planner_service:5001/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, gisUrl }) // ✅ reenviamos datos
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
};


export const deleteClassroom = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    fetch(`http://planner_service:5001/classroom/${id}`, {
        method: "DELETE"
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
};