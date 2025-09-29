import app from '@/app';
import { connectToManagementDatabase } from '@/config/data-source';
import userRouter from '@/routes/user.routes';

const port = process.env.MANAGEMENT_SERVICE_PORT;

const startServer = async () => {
    await connectToManagementDatabase();

    app.use(userRouter);

    app.listen(port, () => {
        console.log(`🚀 App listening on port ${port}`);
    });
};

startServer();
