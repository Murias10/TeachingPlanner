import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types/user.types';

export const errorHandler = (
    error: Error,
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(error.stack);

    const response: ApiResponse = {
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    };

    res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
    const response: ApiResponse = {
        status: 'error',
        message: `Route ${req.originalUrl} not found`
    };

    res.status(404).json(response);
};