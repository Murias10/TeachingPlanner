export interface LoginDTO {
    email: string;
    password: string;
}

export interface RegisterDTO {
    name: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
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
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}