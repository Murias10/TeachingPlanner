/**
 * Centralizado configuration for microservices URLs
 * Uses environment variables with fallbacks to docker-compose defaults
 */
export const SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://auth_service:5003',
    USER: process.env.USER_SERVICE_URL || 'http://user_service:5002',
    PLANNER: process.env.PLANNER_SERVICE_URL || 'http://planner_service:5001'
} as const;
