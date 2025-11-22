import { NextFunction, Response } from 'express';
import { AuditedRequest } from '@/types/audit.types';

/**
 * Middleware to check if user has required role(s)
 * Use: router.get('/endpoint', requireRole(['ADMIN']), controller)
 *
 * @param roles Array of allowed roles
 * @returns Express middleware function
 */
export function requireRole(roles: string[]) {
    return (req: AuditedRequest, res: Response, next: NextFunction) => {
        // Check if user is authenticated
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                data: null,
            });
            return;
        }

        // Check if user has required role
        const userRole = req.user.role;

        if (!userRole || !roles.includes(userRole)) {
            res.status(403).json({
                status: 'error',
                message: `Access denied. Required roles: ${roles.join(', ')}`,
                data: null,
            });
            return;
        }

        // User has required role, continue to next middleware/controller
        next();
    };
}
