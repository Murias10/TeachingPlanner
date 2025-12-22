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

            const result = await response.json();
            // The API returns { success: true, message: '...', data: { connected: boolean, email?: string } }
            // Extract just the data property
            return result.data || null;
        } catch (error) {
            console.error('Error getting Google auth status:', error);
            return null;
        }
    }, []);

    const initiateConnection = useCallback(async () => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/auth/google/initiate`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                console.error('Error initiating Google OAuth');
                return;
            }

            const data = await response.json();

            // Redirigir a la URL de OAuth de Google
            if (data.data?.authUrl) {
                globalThis.location.href = data.data.authUrl;
            }
        } catch (error) {
            console.error('Error initiating Google connection:', error);
        }
    }, []);

    const disconnect = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
        setIsLoading(true);
        try {
            // First, try to get a valid access token to delete Google calendars
            // Note: For now, we proceed without token which will skip Google Calendar deletion
            // but will still clean up the database records
            let accessToken: string | undefined;

            // Delete all calendar syncs (this will also delete Google calendars if token is available)
            try {
                await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync/user/all`, {
                    method: 'DELETE',
                    headers: getAuthHeaders({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({ accessToken })
                });
            } catch (error) {
                console.warn('Error deleting calendar syncs:', error);
                // Continue with disconnect even if this fails
            }

            // Now disconnect the Google account
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
