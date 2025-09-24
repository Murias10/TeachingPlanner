import { NextFunction, Request, Response } from 'express';
import FormData from 'form-data';

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

export const getDegreeByAcronym = (req: Request, res: Response, next: NextFunction) => {
    const { acronym } = req.params;
    fetch(`http://planner_service:5001/degree/acronym/${acronym}`)
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

export const createDegree = async (req: Request, res: Response, next: NextFunction) => {

    const { name, acronym } = req.body;

    fetch("http://planner_service:5001/degree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, acronym })
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

export const deleteDegree = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    fetch(`http://planner_service:5001/degree/${id}`, {
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

export const deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    fetch(`http://planner_service:5001/subject/${id}`, {
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

export const createSubject = async (req: Request, res: Response, next: NextFunction) => {

    const { acronym, year, name, siesCode, semester, degree } = req.body; // ✅ se recibe desde body

    fetch("http://planner_service:5001/subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acronym, year, name, siesCode, semester, degree }) // ✅ reenviamos datos
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
    const degreeAcronym = req.params.acronym;
    fetch(`http://planner_service:5001/courses/degree/acronym/${degreeAcronym}`)
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

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
    const { startYear, endYear, state, degree } = req.body;

    fetch("http://planner_service:5001/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startYear, endYear, state, degree })
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
}


export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    fetch(`http://planner_service:5001/course/${id}`, {
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

export const createCalendar = async (req: Request, res: Response, next: NextFunction) => {
    const { idCourse, semester, start, end } = req.body;
    fetch("http://planner_service:5001/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idCourse, semester, start, end })
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

export const createCalendarWithImport = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const { courseId, semester } = req.body;

        console.log(courseId)
        console.log(semester)
        console.log(files)

        // Crear FormData para enviar al servicio planner
        const formData = new FormData()
        formData.append('courseId', courseId);
        formData.append('semester', semester);

        // Agregar archivos al FormData
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append('files', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype,
                    knownLength: file.buffer.length
                });
            });
        }

        console.log(formData)

        console.log(`Proxying import request to planner service: courseId=${courseId}, semester=${semester}, files=${files?.length || 0}`);

        // Usar fetch con el body y headers correctos para form-data
        const response = await fetch(`http://planner_service:5001/calendar/import`, {
            method: 'POST',
            body: formData as any,
            headers: {
                ...formData.getHeaders(),
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Planner service error:', data);
            res.status(response.status).json(data);
            return;
        }

        console.log('Import successful:', data);
        res.status(201).json(data);
    } catch (error) {
        console.error('Error proxying create calendar with import:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error connecting to planner service',
            data: error instanceof Error ? error.message : error
        });
    }
};


export const getCalendarById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`http://planner_service:5001/calendar/${id}`)
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


export const deleteCalendar = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    fetch(`http://planner_service:5001/calendar/${id}`, {
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