import app from '@/app';
import { Request, Response } from 'express';

const port = 3308;

app.get('/', (_req: Request, res: Response) => {
    res.send('¡Hola desde TypeScript y Express!');
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
