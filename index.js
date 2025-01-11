import express from "express";
import cors from "cors";
import pg from "pg";
import env from "dotenv";

env.config();

const app = express();
app.use(cors());
app.use(express.json());


const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.toString() : null,
    port: process.env.DB_PORT,
});

db.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));


app.get('/', (req, res) => {
    res.send('Budget Tracker Backend is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));