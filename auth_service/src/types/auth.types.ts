export interface LoginDTO {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        name: string;
        firstSurname: string;
        secondSurname: string;
        role: string;
        email: string;
    };
    token: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    errors?: string[];
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface ForgotPasswordDTO {
    email: string;
}

export interface VerifyOTPDTO {
    email: string;
    otp: string;
}

export interface ResetPasswordDTO {
    resetToken: string;
    newPassword: string;
}