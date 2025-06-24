import app from '@/app';
import { Request, Response } from 'express';

const port = 8080;

app.get('/', (_req: Request, res: Response) => {
    res.send('NICO TOLAY');
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
