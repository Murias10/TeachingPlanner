import { useState, useCallback } from 'react';
import VITE_GATEWAY_API_URL from '@/config/api';
import { getAuthHeaders } from '@/utils/authHeaders';
import { useQueryClient } from '@tanstack/react-query';

interface GoogleAuthStatus {
    connected: boolean;
    email?: string;
}

export const useGoogleAuth = () => {
    const queryClient = useQueryClient();
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
            // Disconnect the Google account
            // The auth_service will handle deleting calendar syncs and Google calendars
            const response = await fetch(`${VITE_GATEWAY_API_URL}/auth/google/disconnect`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                setIsLoading(false);
                return {
                    success: false,
                    message: data.message || 'Error al desconectar Google Calendar'
                };
            }

            // Poll calendar syncs to ensure all calendars are deleted
            // Keep checking every 2 seconds until no calendar syncs remain
            const pollInterval = 2000;
            const maxAttempts = 60; // 2 minutes max
            let attempts = 0;

            while (attempts < maxAttempts) {
                attempts++;

                try {
                    const syncsResponse = await fetch(`${VITE_GATEWAY_API_URL}/calendar-sync`, {
                        method: 'GET',
                        headers: getAuthHeaders(),
                    });

                    if (syncsResponse.ok) {
                        const syncsResult = await syncsResponse.json();
                        const syncsData = syncsResult.data || [];

                        // If no more syncs exist, deletion is complete
                        if (syncsData.length === 0) {
                            console.log('All calendar syncs deleted successfully');
                            break;
                        }

                        console.log(`Waiting for ${syncsData.length} calendar sync(s) to be deleted...`);
                    }
                } catch (pollError) {
                    console.warn('Error polling calendar syncs:', pollError);
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            if (attempts >= maxAttempts) {
                console.warn('Timed out waiting for calendar syncs to be deleted');
            }

            // Invalidate queries to refresh the UI
            await queryClient.invalidateQueries({ queryKey: ['calendarSyncs'] });
            await queryClient.invalidateQueries({ queryKey: ['googleAuthStatus'] });

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
    }, [queryClient]);

    return {
        getStatus,
        initiateConnection,
        disconnect,
        isLoading
    };
};
