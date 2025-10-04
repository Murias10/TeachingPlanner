import { useCallback } from "react";
import VITE_GATEWAY_API_URL from "@/config/api";

interface DeleteResult {
    success: boolean;
    message?: string;
    status?: number;
    data?: unknown;
}

export function useDeleteSubject() {
    const deleteSubject = useCallback(
        async (subjectId: string, refetch: () => void): Promise<DeleteResult> => {
            try {
                const response = await fetch(`${VITE_GATEWAY_API_URL}/subject/${subjectId}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    refetch();
                    return { success: true };
                }

                const errorBody = await response.json().catch(() => ({}));

                return {
                    success: false,
                    status: response.status,
                    message: errorBody.message || "Error al eliminar la asignatura",
                    data: errorBody
                };

            } catch (error) {
                console.error("Error de red al eliminar asignatura:", error);
                return {
                    success: false,
                    message: "Error de conexión. Inténtalo de nuevo."
                };
            }
        },
        []
    );

    return { deleteSubject };
}