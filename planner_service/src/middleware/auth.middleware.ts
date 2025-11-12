import { Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AuditedRequest, JwtPayload } from '@/types/audit.types';

/**
 * Extracts JWT token from Authorization header
 * Expected format: "Bearer <token>"
 *
 * @param authHeader - The Authorization header value
 * @returns The JWT token or null if not found
 */
function extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return null;
    }

    return parts[1];
}

/**
 * Authenticates user by verifying JWT token from request headers
 * Attaches decoded user information to the request object
 *
 * This middleware:
 * - Extracts JWT token from Authorization header
 * - Verifies token signature using JWT_SECRET
 * - Decodes payload containing user information (userId, email, role)
 * - Attaches user data to req.user for use in controllers
 * - Continues without authentication error if token is missing/invalid
 *   (routes that require auth should use requireAuth middleware)
 *
 * @param req - Express request object (AuditedRequest with optional user)
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateToken = (
    req: AuditedRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization as string | undefined;
        const token = extractTokenFromHeader(authHeader);

        // If no token found, continue without authentication
        // Routes that require authentication should use requireAuth middleware
        if (!token) {
            next();
            return;
        }

        // Get JWT secret from environment or use fallback
        const secret = process.env.JWT_SECRET || 'fallback-secret-key';

        // Verify and decode the JWT token
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // Attach authenticated user to request
        req.user = decoded;

        // Continue to next middleware/route handler
        next();
    } catch (error) {
        // Handle token verification errors gracefully
        // Don't fail the request - let route handlers decide if auth is required
        if (error instanceof TokenExpiredError) {
            console.warn('Token verification failed: token expired', {
                expiredAt: error.expiredAt,
            });
        } else if (error instanceof JsonWebTokenError) {
            console.warn('Token verification failed: invalid token', {
                message: error.message,
            });
        } else if (error instanceof Error) {
            console.warn('Token verification failed: unexpected error', {
                message: error.message,
            });
        } else {
            console.warn('Token verification failed: unknown error', { error });
        }

        // Continue without authentication
        next();
    }
};

/**
 * Middleware to enforce authentication requirement
 * Use this on routes that must have an authenticated user
 *
 * Returns 401 Unauthorized if no valid token was provided/verified
 *
 * @param req - Express request object (AuditedRequest)
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireAuth = (
    req: AuditedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            status: 'error',
            message: 'Authentication required',
            data: null,
        });
        return;
    }

    next();
};
