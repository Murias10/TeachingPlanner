/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * según los schemas de Zod del backend
 */
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Mínimo 8 caracteres
    if (password.length < 8) {
        errors.push('error.password.min.length');
    }

    // Máximo 128 caracteres
    if (password.length > 128) {
        errors.push('error.password.too.long');
    }

    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
        errors.push('error.password.uppercase');
    }

    // Al menos una minúscula
    if (!/[a-z]/.test(password)) {
        errors.push('error.password.lowercase');
    }

    // Al menos un número
    if (!/[0-9]/.test(password)) {
        errors.push('error.password.number');
    }

    // Al menos un carácter especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('error.password.special');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Devuelve los requisitos de contraseña como array de strings de traducción
 */
export function getPasswordRequirements(): string[] {
    return [
        'error.password.min.length',
        'error.password.uppercase',
        'error.password.lowercase',
        'error.password.number',
        'error.password.special'
    ];
}
