import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types/user.types';

export const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
    const { name, firstSurname, secondSurname, role, email, password } = req.body;
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
        errors.push('Name is required');
    }
    if (!firstSurname || firstSurname.trim().length === 0) {
        errors.push('First surname is required');
    }
    if (!secondSurname || secondSurname.trim().length === 0) {
        errors.push('Second surname is required');
    }
    if (!role || role.trim().length === 0) {
        errors.push('Role is required');
    }
    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
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

export const validateUpdateUser = (req: Request, res: Response, next: NextFunction) => {
    const { name, firstSurname, secondSurname, role, email } = req.body;
    const errors: string[] = [];

    if (name !== undefined && (!name || name.trim().length === 0)) {
        errors.push('Name cannot be empty');
    }
    if (firstSurname !== undefined && (!firstSurname || firstSurname.trim().length === 0)) {
        errors.push('First surname cannot be empty');
    }
    if (secondSurname !== undefined && (!secondSurname || secondSurname.trim().length === 0)) {
        errors.push('Second surname cannot be empty');
    }
    if (role !== undefined && (!role || role.trim().length === 0)) {
        errors.push('Role cannot be empty');
    }
    if (email !== undefined && (!email || !isValidEmail(email))) {
        errors.push('Valid email is required');
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

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};