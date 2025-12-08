import { z } from 'zod';

// Login schema (sin requisitos de contraseña fuerte en login)
export const loginSchema = z.object({
    email: z.string()
        .min(1, { message: 'error.email.required' })
        .email({ message: 'error.email.invalid' })
        .max(254, { message: 'error.email.too.long' })
        .transform(e => e.trim().toLowerCase()),
    password: z.string()
        .min(1, { message: 'error.password.required' })
        .max(128, { message: 'error.password.too.long' })
});

// Reset password schema (con requisitos de contraseña fuerte)
export const resetPasswordSchema = z.object({
    resetToken: z.string()
        .min(1, { message: 'error.token.required' }),
    newPassword: z.string()
        .min(8, { message: 'error.password.min.length' })
        .max(128, { message: 'error.password.too.long' })
        .regex(/[A-Z]/, { message: 'error.password.uppercase' })
        .regex(/[a-z]/, { message: 'error.password.lowercase' })
        .regex(/[0-9]/, { message: 'error.password.number' })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: 'error.password.special' })
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
    email: z.string()
        .min(1, { message: 'error.email.required' })
        .email({ message: 'error.email.invalid' })
        .max(254, { message: 'error.email.too.long' })
        .transform(e => e.trim().toLowerCase())
});

// Verify OTP schema
export const verifyOTPSchema = z.object({
    email: z.string()
        .email({ message: 'error.email.invalid' })
        .transform(e => e.trim().toLowerCase()),
    otp: z.string()
        .min(1, { message: 'error.otp.required' })
});
