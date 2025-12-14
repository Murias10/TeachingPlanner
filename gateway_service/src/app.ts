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

    // Producción - añade tus dominios reales aquí
    "https://156.35.95.65",
    "http://156.35.95.65",
    "https://tfg.juanramon.eii-planificador2",
    "http://tfg.juanramon.eii-planificador2",
    "https://teachingplanner.duckdns.org",
    "http://teachingplanner.duckdns.org",
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