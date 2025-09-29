import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types/auth.types';

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const errors: string[] = [];

    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }
    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        const response: ApiResponse = {
            success: false,
            message: 'Validation failed',
            error: errors.join(', ')
        };
        res.status(400).json(response);
        return
    }

    next();
};

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
    const { name, firstSurname, secondSurname, role, email, password } = req.body;
    const errors: string[] = [];

    if (!name?.trim()) errors.push('Name is required');
    if (!firstSurname?.trim()) errors.push('First surname is required');
    if (!secondSurname?.trim()) errors.push('Second surname is required');
    if (!role?.trim()) errors.push('Role is required');
    if (!email || !isValidEmail(email)) errors.push('Valid email is required');
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters');

    if (errors.length > 0) {
        const response: ApiResponse = {
            success: false,
            message: 'Validation failed',
            error: errors.join(', ')
        };
        res.status(400).json(response);
        return
    }

    next();
};

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};