import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    // Solo en desarrollo: cargamos .env desde la carpeta de trabajo
    const result = dotenv.config({ path: "../.env" });
    if (result.error) {
        console.warn("⚠️  No se encontró .env, asumiendo variables del entorno");
    }
}
