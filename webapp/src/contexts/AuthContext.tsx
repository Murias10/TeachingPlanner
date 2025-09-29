import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '@/types/auth.types';
import { authService } from '@/services/auth.services'

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

type AuthAction =
    | { type: 'LOGIN_START' }
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'LOGIN_FAILURE' }
    | { type: 'LOGOUT' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<boolean>;
    register: (data: RegisterData) => Promise<boolean>;
    logout: () => void;
    updateUser: (user: User) => void;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                ...state,
                isLoading: true,
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
            };
        case 'LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        case 'UPDATE_USER':
            return {
                ...state,
                user: action.payload,
            };
        default:
            return state;
    }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Verificar si hay token guardado al cargar la app
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Validar token con el backend
                    const isValid = await authService.validateToken(token);
                    if (isValid) {
                        // Obtener datos del usuario
                        const userData = await authService.getProfile();
                        dispatch({
                            type: 'LOGIN_SUCCESS',
                            payload: { user: userData, token },
                        });
                    } else {
                        localStorage.removeItem('token');
                        dispatch({ type: 'LOGIN_FAILURE' });
                    }
                } else {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } catch {
                localStorage.removeItem('token');
                dispatch({ type: 'LOGIN_FAILURE' });
            }
        };

        initializeAuth();
    }, []);

    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        dispatch({ type: 'LOGIN_START' });

        try {
            const response = await authService.login(credentials);

            // Guardar token en localStorage
            localStorage.setItem('token', response.token);

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user: response.user,
                    token: response.token,
                },
            });

            return true;
        } catch {
            dispatch({ type: 'LOGIN_FAILURE' });
            return false;
        }
    };

    const register = async (data: RegisterData): Promise<boolean> => {
        dispatch({ type: 'LOGIN_START' });

        try {
            const response = await authService.register(data);

            // Guardar token en localStorage
            localStorage.setItem('token', response.token);

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user: response.user,
                    token: response.token,
                },
            });

            return true;
        } catch {
            dispatch({ type: 'LOGIN_FAILURE' });
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        authService.logout();
        dispatch({ type: 'LOGOUT' });
    };

    const updateUser = (user: User) => {
        dispatch({ type: 'UPDATE_USER', payload: user });
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};