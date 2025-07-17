import app from '@/app';
import { connectToPlannerDatabase } from '@/config/data-source';
import userRouter from '@/routes/user.routes';
import degreeRouter from '@/routes/degree.routes';

const port = process.env.PLANNER_SERVICE_PORT;

const startServer = async () => {
    await connectToPlannerDatabase();

    app.use(userRouter);
    app.use(degreeRouter);

    app.listen(port, () => {
        console.log(`🚀 App listening on port ${port}`);
    });
};

startServer();
