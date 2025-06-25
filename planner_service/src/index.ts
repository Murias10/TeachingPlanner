import app from '@/app'
import userRouter from '@/routes/user.routes'
import degreeRouter from '@/routes/degree.routes'
import { AppDataSource } from '@/config/data-source'

const port = 5001

app.use(userRouter)

app.use(degreeRouter)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const connectWithRetry = async () => {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            await AppDataSource.initialize();
            console.log("✅ Connected to the database");
            break;
        } catch (err) {
            attempts++;
            console.log(`❌ Failed to connect (attempt ${attempts})`);
            console.error(err);
            await new Promise((res) => setTimeout(res, 5000)); // espera 5 segundos
        }
    }

    if (attempts === maxAttempts) {
        console.error("💥 Could not connect to the database after several attempts.");
        process.exit(1);
    }
};

connectWithRetry();