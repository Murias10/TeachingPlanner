export const TIMEOUTS = {
  STANDARD: 10000,
  SHORT: 5000,
  VERY_SHORT: 2000,
  ANIMATION: 500,
} as const;

export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'Admin123!',
} as const;

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
