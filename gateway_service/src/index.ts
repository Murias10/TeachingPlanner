import app from '@/app';
import plannerRouter from '@/routes/planner.routes';
import statusRouter from '@/routes/status.routes';
import authRouter from '@/routes/auth.routes'
import userRouter from '@/routes/user.routes'

const port = process.env.GATEWAY_SERVICE_PORT;

app.use('/api', plannerRouter);
app.use('/api', userRouter);
app.use('/api', authRouter);
app.use('/api', statusRouter);

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
