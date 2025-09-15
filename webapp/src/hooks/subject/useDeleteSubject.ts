import { useCallback } from "react";

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
                const response = await fetch(`http://localhost:8080/subject/${subjectId}`, {
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