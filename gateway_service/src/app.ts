import express from 'express';
import bodyParser from 'body-parser';
import statusRouter from '@/routes/status.routes';
import plannerRouter from '@/routes/planner.routes';
import userRouter from '@/routes/user.routes';
import authRouter from '@/routes/auth.routes';
import cors from 'cors';

const app = express();

app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// Dominios que permites
const whitelist = [
    `http://localhost:${process.env.WEBAPP_PORT}`,
    `http://localhost`,
    `http://localhost:5173`,
    "https://app-produccion.com",
];

// Opciones de CORS usando la whitelist
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // origin puede ser undefined para peticiones desde servidor
        if (!origin || whitelist.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: el origen ${origin} no está en la whitelist`));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

app.use(cors(corsOptions));

export default app;