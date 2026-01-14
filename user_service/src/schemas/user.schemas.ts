import { z } from 'zod';

const ALLOWED_ROLES = ['ADMIN', 'PROFESSOR'] as const;

// Create user schema (admin creando usuarios - sin password, opcionalmente envía email de activación)
export const createUserSchema = z.object({
    name: z.string()
        .min(1, { message: 'error.name.required' })
        .max(100, { message: 'error.name.too.long' })
        .trim(),
    firstSurname: z.string()
        .min(1, { message: 'error.first.surname.required' })
        .max(100, { message: 'error.first.surname.too.long' })
        .trim(),
    secondSurname: z.string()
        .min(1, { message: 'error.second.surname.required' })
        .max(100, { message: 'error.second.surname.too.long' })
        .trim(),
    role: z.enum(ALLOWED_ROLES, {
        errorMap: () => ({ message: 'error.role.invalid' })
    }),
    email: z.string()
        .email({ message: 'error.email.invalid' })
        .max(254, { message: 'error.email.too.long' })
        .transform(e => e.trim().toLowerCase()),
    unioviUser: z.string()
        .max(255, { message: 'error.uniovi.user.too.long' })
        .trim()
        .optional(),
    sendEmail: z.boolean().optional().default(false),
    language: z.enum(['es', 'en']).optional().default('es')
});

// Update user schema (campos opcionales)
export const updateUserSchema = z.object({
    name: z.string()
        .min(1, { message: 'error.name.required' })
        .max(100, { message: 'error.name.too.long' })
        .trim()
        .optional(),
    firstSurname: z.string()
        .min(1, { message: 'error.first.surname.required' })
        .max(100, { message: 'error.first.surname.too.long' })
        .trim()
        .optional(),
    secondSurname: z.string()
        .min(1, { message: 'error.second.surname.required' })
        .max(100, { message: 'error.second.surname.too.long' })
        .trim()
        .optional(),
    role: z.enum(ALLOWED_ROLES, {
        errorMap: () => ({ message: 'error.role.invalid' })
    }).optional(),
    email: z.string()
        .email({ message: 'error.email.invalid' })
        .max(254, { message: 'error.email.too.long' })
        .transform(e => e.trim().toLowerCase())
        .optional(),
    unioviUser: z.string()
        .max(255, { message: 'error.uniovi.user.too.long' })
        .trim()
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'error.no.fields.to.update'
});

// Update password schema
export const updatePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, { message: 'error.current.password.required' }),
    newPassword: z.string()
        .min(8, { message: 'error.password.min.length' })
        .max(128, { message: 'error.password.too.long' })
        .regex(/[A-Z]/, { message: 'error.password.uppercase' })
        .regex(/[a-z]/, { message: 'error.password.lowercase' })
        .regex(/[0-9]/, { message: 'error.password.number' })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: 'error.password.special' })
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'error.password.same.as.current',
    path: ['newPassword']
});
