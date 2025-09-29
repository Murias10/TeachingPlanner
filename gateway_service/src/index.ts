import app from '@/app';
import plannerRouter from '@/routes/planner.routes';
import statusRouter from '@/routes/status.routes';
import authRouter from '@/routes/auth.routes'
import userRouter from '@/routes/user.routes'

const port = 8080;

app.use(plannerRouter);
app.use(statusRouter);
app.use(authRouter);
app.use(userRouter)

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
