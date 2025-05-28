import app from '@/app'
import express from 'express'
import { Request, Response } from 'express'
import userRouter from '@/routes/user.routes'
import { AppDataSource } from '@/config/data-source'

const port = 3007

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



AppDataSource.initialize()
    .then(() => {
        console.log('📦 Data Source initialized');
    })
    .catch((err) => {
        console.error('❌ Error during Data Source initialization:', err);
    });