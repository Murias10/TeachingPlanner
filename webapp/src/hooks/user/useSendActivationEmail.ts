import { useCallback } from 'react';
import API_URL from '@/config/api';

interface SendActivationEmailResult {
    success: boolean;
    message: string;
}

export const useSendActivationEmail = () => {
    const sendActivationEmail = useCallback(async (userId: string): Promise<SendActivationEmailResult> => {
        try {
            const response = await fetch(`${API_URL}/user/${userId}/send-activation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.status === 'success') {
                return {
                    success: true,
                    message: data.message || 'Email de activación enviado correctamente',
                };
            }

            return {
                success: false,
                message: data.message || 'No se pudo enviar el email de activación',
            };
        } catch (error) {
            console.error('Error sending activation email:', error);
            return {
                success: false,
                message: 'Error al enviar el email de activación',
            };
        }
    }, []);

    return { sendActivationEmail };
};
