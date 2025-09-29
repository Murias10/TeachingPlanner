import app from '@/app';
import { connectToManagementDatabase } from '@/config/data-source';
import authRouter from '@/routes/auth.routes';

const port = process.env.PLANNER_SERVICE_PORT;

const startServer = async () => {
    await connectToManagementDatabase();

    app.use(authRouter);

    // Error handling
    app.use((error: Error, req: any, res: any, next: any) => {
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    });

    app.use((req: any, res: any) => {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });

    app.listen(port, () => {
        console.log(`🚀 App listening on port ${port}`);
    });
};

startServer();
