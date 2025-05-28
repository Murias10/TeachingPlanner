import app from '@/app'
import express from 'express'
import { Request, Response } from 'express'
import userRouter from '@/routes/user.routes'
import { AppDataSource } from '@/config/data-source'

const port = 3307

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.get('/', (_req: Request, res: Response) => {
    res.send('Hello World!')
})

app.post('/api', (req: Request, res: Response) => {
    const { name, email } = req.body
    res.json({ name, email })
}
)

app.use('/user', userRouter)

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