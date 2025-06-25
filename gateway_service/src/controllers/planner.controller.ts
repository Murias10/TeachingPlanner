import { NextFunction, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';


const getDegrees = (_req: Request, res: Response, next: NextFunction) => {
    fetch('http://localhost:5001/degrees')
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            res.json(data);
        })
        .catch((error) => {
            next(error);
        });
}

export { getDegrees };
