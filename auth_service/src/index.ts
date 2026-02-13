import app from '@/app';
import { connectToManagementDatabase } from '@/config/data-source';
import authRouter from '@/routes/auth.routes';
import { seedDatabase } from '@/scripts/seed-database';

const port = process.env.AUTH_SERVICE_PORT;

const startServer = async () => {
    await connectToManagementDatabase();

    // Ejecutar seed de datos después de que las tablas se creen
    await seedDatabase();

    app.use(authRouter);

    // Error handling
    app.use((error: Error, _req: any, res: any, _next: any) => {
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    });

    app.use((_req: any, res: any) => {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });

    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 App listening on port ${port}`);
    });
};

startServer();
