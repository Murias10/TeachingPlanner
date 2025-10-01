export interface CreateUserDTO {
    name: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
    email: string;
    password: string;
}

export interface UpdateUserDTO {
    name?: string;
    firstSurname?: string;
    secondSurname?: string;
    role?: string;
    email?: string;
}

export interface UserResponse {
    id: string;
    name: string;
    firstSurname: string;
    secondSurname: string;
    role: string;
    email: string;
}

// types/user.types.ts
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    error?: string;
}