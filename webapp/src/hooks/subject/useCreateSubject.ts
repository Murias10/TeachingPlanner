import { useCallback } from "react";
import VITE_GATEWAY_API_URL from "@/config/api";

interface CreateResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

interface SubjectFormData {
    acronym: string;
    year: number;
    name: string;
    siesCode: string;
    semester: number;
}

export function useCreateSubject() {

    const createSubject = useCallback(
        async (formData: SubjectFormData, degreeId: string, refetch: () => void): Promise<CreateResult> => {

            const payload = {
                ...formData,
                degree: {
                    id: degreeId
                }
            };

            try {
                const response = await fetch(`${VITE_GATEWAY_API_URL}/subject`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    refetch();
                    return { success: true };
                }

                const errorBody = await response.json().catch(() => ({}));

                return {
                    success: false,
                    status: response.status,
                    message: errorBody.message || "Error al crear la asignatura",
                    data: errorBody
                };

            } catch (error) {
                console.error("Error de red al crear asignatura:", error);
                return {
                    success: false,
                    message: "Error de conexión. Inténtalo de nuevo."
                };
            }
        },
        []
    );

    return { createSubject };
}