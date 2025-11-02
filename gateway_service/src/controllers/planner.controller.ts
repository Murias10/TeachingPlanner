import { NextFunction, Request, Response } from 'express';
import FormData from 'form-data';
import axios from 'axios';


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

export const updateDegree = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, acronym } = req.body;

    fetch(`http://planner_service:5001/degree/${id}`, {
        method: "PATCH",
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

export const updateSubject = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { acronym, year, name, siesCode, semester } = req.body;

    fetch(`http://planner_service:5001/subject/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acronym, year, name, siesCode, semester })
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

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { startYear, endYear, state } = req.body;

    fetch(`http://planner_service:5001/course/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startYear, endYear, state })
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


export const updateClassroom = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { code, gisUrl } = req.body;

    fetch(`http://planner_service:5001/classroom/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, gisUrl })
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
        const response = await axios.post(
            'http://planner_service:5001/calendar/import',
            formData,
            {
                headers: formData.getHeaders(),
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


export const getCalendarEvents = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`http://planner_service:5001/calendar/${id}/events`)
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

export const exportCalendar = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`http://planner_service:5001/calendar/${id}/export`)
        .then(async (response) => {
            // Copia los headers del planner service (incluyendo Content-Disposition para el filename)
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });

            // Para binarios (ZIP), obtener como buffer y enviar como blob
            const buffer = await response.arrayBuffer();
            res.status(response.status).send(Buffer.from(buffer));
        })
        .catch((error) => {
            next(error);
        });
}