import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// Dominios que permites
const whitelist = new Set([
    // Desarrollo local
    `http://localhost:${process.env.WEBAPP_PORT}`,
    `http://localhost`,
    `http://localhost:5173`,

    // Producción - usa variables de entorno
    ...(process.env.DOMAIN ? [
        `https://${process.env.DOMAIN}`,
        `http://${process.env.DOMAIN}`
    ] : []),

    ...(process.env.SERVER_IP ? [
        `https://${process.env.SERVER_IP}`,
        `http://${process.env.SERVER_IP}`
    ] : []),

    // Dominios adicionales (mantener por compatibilidad)
    "https://tfg.juanramon.eii-planificador2",
    "http://tfg.juanramon.eii-planificador2",
]);

// Opciones de CORS usando la whitelist
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // origin puede ser undefined para peticiones desde servidor
        if (!origin || whitelist.has(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: el origen ${origin} no está en la whitelist`));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
};

app.use(cors(corsOptions));

export default app;