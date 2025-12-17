import { useState, useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';

interface GoogleAuthStatus {
    connected: boolean;
    email?: string;
}

export const useGoogleAuth = () => {
    const [isLoading, setIsLoading] = useState(false);

    const getStatus = useCallback(async (): Promise<GoogleAuthStatus | null> => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/auth/google/status`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting Google auth status:', error);
            return null;
        }
    }, []);

    const initiateConnection = useCallback(() => {
        // Redirigir al flujo OAuth de Google
        window.location.href = `${VITE_GATEWAY_API_URL}/auth/google/initiate`;
    }, []);

    const disconnect = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/auth/google/disconnect`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error al desconectar Google Calendar'
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error disconnecting Google:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getStatus,
        initiateConnection,
        disconnect,
        isLoading
    };
};
