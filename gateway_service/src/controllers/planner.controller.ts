import { NextFunction, Request, Response } from 'express';

const getDegrees = (_req: Request, res: Response, next: NextFunction) => {
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

export { getDegrees };
