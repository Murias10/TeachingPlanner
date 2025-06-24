import { Request, Response } from 'express';

const getAllDegrees = (_req: Request, res: Response) => {
    res.json({
        status: 'success',
        data: {
            degrees: [
                { value: 'bachelor', label: 'Bachelor of Science' },
                { value: 'master', label: 'Master of Science' },
                { value: 'phd', label: 'Doctor of Philosophy' },
            ],
        },
    });
}

export { getAllDegrees };
