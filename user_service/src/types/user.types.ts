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

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}