import app from '@/app';
import { connectToManagementDatabase } from '@/config/data-source';
import userRouter from '@/routes/user.routes';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';

const port = process.env.USER_SERVICE_PORT;

const startServer = async () => {
    await connectToManagementDatabase();

    app.use(userRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 App listening on port ${port}`);
    });


};

startServer();
