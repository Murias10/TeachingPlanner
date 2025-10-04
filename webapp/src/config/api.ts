// Obtener la URL base del API desde las variables de entorno
const VITE_GATEWAY_API_URL = import.meta.env.VITE_GATEWAY_API_URL;

// Validar que la variable existe (opcional pero recomendado)
if (!VITE_GATEWAY_API_URL) {
    console.error('VITE_GATEWAY_API_URL no está definida en las variables de entorno');
}

export default VITE_GATEWAY_API_URL;