import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, ApiResponse } from '@/types/auth.types';

interface AuthRequest extends Request {
    user?: JwtPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        const response: ApiResponse = {
            success: false,
            message: 'Access token is required'
        };
        res.status(401).json(response);
        return
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        const response: ApiResponse = {
            success: false,
            message: 'Invalid or expired token'
        };
        res.status(403).json(response);
        return
    }
};