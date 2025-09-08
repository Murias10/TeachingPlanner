import { useCallback } from "react";

export const useCreateDegree = () => {
    const createDegree = useCallback(async (
        name: string,
        acronym: string,
        refetch?: () => void
    ) => {
        try {
            const response = await fetch("http://localhost:8080/degree", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, acronym })
            });

            const json = await response.json();

            // Si la operación fue exitosa y se pasó refetch, ejecutarlo
            if (response.ok && refetch) {
                refetch();
            }

            return {
                success: response.ok,
                status: response.status,
                message: json.message || (response.ok ? "Titulación creada exitosamente" : "Error al crear titulación"),
                data: json.data,
            };
        } catch (error) {
            return {
                success: false,
                status: 500,
                message: "Error de red",
                data: error,
            };
        }
    }, []);

    return { createDegree };
}