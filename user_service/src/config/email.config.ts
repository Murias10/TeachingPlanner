export const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // false for port 587, true for 465
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@teachingplanner.com',
};

export const appConfig = {
    appName: 'Teaching Planner',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    activationTokenExpiry: 48 * 60 * 60 * 1000, // 48 hours in milliseconds
};
