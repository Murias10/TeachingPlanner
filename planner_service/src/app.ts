import express from 'express';
import bodyParser from 'body-parser';
import { authenticateToken } from '@/middleware/auth.middleware';

const app = express();

app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(authenticateToken);

export default app;