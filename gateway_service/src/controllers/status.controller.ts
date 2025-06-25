import { Request, Response } from 'express';

const checkStatus = (_req: Request, res: Response) => {
    res.json({
        status: 'success',
        data: {
            message: 'Service is running smoothly',
        },
    });
};

export { checkStatus };
