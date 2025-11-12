import { AuditedRequest } from '@/types/audit.types';

/**
 * Extracts and validates user email from an authenticated request
 *
 * @param req - The authenticated request object containing user data
 * @returns The user's email address if authenticated and email is present, null otherwise
 *
 * @example
 * ```typescript
 * const email = getUserEmailFromRequest(req);
 * if (email) {
 *   puntualEvent.createdBy = email;
 * }
 * ```
 */
export const getUserEmailFromRequest = (req: AuditedRequest): string | null => {
    return req.user?.email ?? null;
};

/**
 * Extracts and validates user ID from an authenticated request
 *
 * @param req - The authenticated request object containing user data
 * @returns The user's ID if authenticated and ID is present, null otherwise
 *
 * @example
 * ```typescript
 * const userId = getUserIdFromRequest(req);
 * if (userId) {
 *   // Use for user-based filtering or logging
 * }
 * ```
 */
export const getUserIdFromRequest = (req: AuditedRequest): string | null => {
    return req.user?.userId ?? null;
};

/**
 * Checks if a request contains authenticated user information
 *
 * @param req - The request object to check
 * @returns True if the request contains valid user authentication data, false otherwise
 *
 * @example
 * ```typescript
 * if (isAuthenticated(req)) {
 *   // User is authenticated, safe to use req.user
 *   const email = req.user.email;
 * } else {
 *   // User is not authenticated
 *   return res.status(401).json({ error: 'Authentication required' });
 * }
 * ```
 */
export const isAuthenticated = (req: AuditedRequest): boolean => {
    return req.user !== null && req.user !== undefined;
};
