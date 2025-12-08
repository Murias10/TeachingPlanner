export interface User {
    id: string;
    name: string;
    unioviUser?: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
    email: string;
    isActive: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    unioviUser?: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}