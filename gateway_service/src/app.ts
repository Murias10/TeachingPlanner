import express from 'express';
import bodyParser from 'body-parser';
import statusRouter from '@/routes/status.routes';

const app = express();

app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(statusRouter);

export default app;