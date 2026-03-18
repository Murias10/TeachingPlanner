/**
 * Helper function to get authorization headers with Bearer token
 * Retrieves token from localStorage and includes it in Authorization header if present
 */
export const getAuthHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
    const token = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');
    return {
        ...additionalHeaders,
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};
