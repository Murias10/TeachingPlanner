import app from '@/app'
import { Request, Response } from 'express'

const port = 3000

app.get('/', (_req: Request, res: Response) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
