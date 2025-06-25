import app from '@/app';
import degreeRouter from '@/routes/planner.routes';
import statusRouter from '@/routes/status.routes';

const port = 8080;

app.use(degreeRouter);
app.use(statusRouter);

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
