import { LoginCredentials, RegisterData, AuthResponse, ApiResponse, User } from '@/types/auth.types';

const API_BASE_URL = 'http://gateway_service:8080';

class AuthService {
    private getToken(): string | null {
        return localStorage.getItem('token');
    }

    private getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data: ApiResponse<AuthResponse> = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Login failed');
        }

        return data.data!;

    }

    async register(registerData: RegisterData): Promise<AuthResponse> {

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData),
        });

        const data: ApiResponse<AuthResponse> = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Registration failed');
        }

        return data.data!;

    }

    async validateToken(token: string): Promise<boolean> {

        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const data: ApiResponse<{ userId: string }> = await response.json();
        return response.ok && data.success;

    }

    async getProfile(): Promise<User> {

        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: this.getAuthHeaders(),
        });

        const data: ApiResponse<User> = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to get profile');
        }

        return data.data!;

    }

    logout(): void {
        // En caso de que quieras hacer algo en el logout
        // Como invalidar el token en el servidor
    }
}

export const authService = new AuthService();