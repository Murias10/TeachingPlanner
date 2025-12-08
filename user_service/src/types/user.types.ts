export interface CreateUserDTO {
    name: string;
    unioviUser?: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
    email: string;
    sendEmail?: boolean;
}

export interface UpdateUserDTO {
    name?: string;
    unioviUser?: string;
    firstSurname?: string;
    secondSurname?: string;
    role?: string;
    email?: string;
}

export interface UserResponse {
    id: string;
    name: string;
    unioviUser?: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
    email: string;
    isActive: boolean;
}

// types/user.types.ts
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    error?: string;
    errors?: string[];
}