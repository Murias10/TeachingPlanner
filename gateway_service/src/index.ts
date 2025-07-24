import app from '@/app';
import plannerRouter from '@/routes/planner.routes';
import statusRouter from '@/routes/status.routes';

const port = 8080;

app.use(plannerRouter);
app.use(statusRouter);

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
