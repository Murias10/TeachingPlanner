
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0, // Datos son stale inmediatamente después de cambios
            gcTime: 5 * 60 * 1000, // Garbage collect después de 5 minutos
            retry: 1,
            refetchOnWindowFocus: true, // Refetch cuando vuelve el foco a la ventana
            refetchOnReconnect: true, // Refetch al reconectar a la red
        },
        mutations: {
            retry: 1,
        },
    },
});
