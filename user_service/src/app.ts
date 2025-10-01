import express from 'express';
import bodyParser from 'body-parser';


const app = express();


app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

export default app;