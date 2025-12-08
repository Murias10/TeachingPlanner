import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiResponse } from '@/types/user.types';

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.errors.map(e => e.message);
            const response: ApiResponse = {
                status: 'error',
                message: 'validation.failed',
                errors
            };
            res.status(400).json(response);
            return;
        }

        req.body = result.data;
        next();
    };
};
