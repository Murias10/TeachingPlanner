import app from '@/app';
import plannerRouter from '@/routes/planner.routes';
import statusRouter from '@/routes/status.routes';
import authRouter from '@/routes/auth.routes'
import userRouter from '@/routes/user.routes'

const port = process.env.GATEWAY_SERVICE_PORT;

app.use(plannerRouter);
app.use(userRouter)
app.use(authRouter);
app.use(statusRouter);

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
