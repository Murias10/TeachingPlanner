import { Request } from 'express';

/**
 * JWT Payload structure
 * Contains user information encoded in the JWT token
 * This data is cryptographically verified and extracted by the auth middleware
 */
export interface JwtPayload {
    /** Unique identifier of the user from the auth service */
    userId: string;

    /** Email address of the user (used for audit tracking) */
    email: string;

    /** Role assigned to the user (e.g., ADMIN, PROFESSOR) */
    role: string;

    /** Token issued at timestamp (seconds since epoch) */
    iat?: number;

    /** Token expiration timestamp (seconds since epoch) */
    exp?: number;
}

/**
 * Extended Express Request object with optional user authentication data
 * Populated by the authenticateToken middleware
 * If no valid JWT is provided, user will be undefined
 */
export interface AuditedRequest extends Request {
    /** Authenticated user information, undefined if not authenticated */
    user?: JwtPayload;
}
