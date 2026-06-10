import express from 'express';
import path from 'path';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from 'url';

import db from './db/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =========================
   SETTINGS
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(
    session({
        secret: 'secret123',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   UPLOAD FIX
========================= */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

/* =========================
   OPENAI
========================= */

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   DATABASE INIT
========================= */

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS trainers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category TEXT,
            specialty TEXT,
            experience TEXT,
            bio TEXT,
            image TEXT,
            rating REAL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trainer_id INTEGER,
            date TEXT,
            time TEXT,
            is_booked INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            trainer_id INTEGER,
            date TEXT,
            time TEXT,
            image TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            trainer_id INTEGER,
            rating INTEGER,
            comment TEXT
        )
    `);

});

/* =========================
   AUTH
========================= */

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    db.run(
        `INSERT INTO users (username, password) VALUES (?, ?)`,
        [username, hash],
        function (err) {
            if (err) {
                return res.json({ success: false, message: 'Користувач вже існує' });
            }
            res.json({ success: true });
        }
    );
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        `SELECT * FROM users WHERE username = ?`,
        [username],
        async (err, user) => {

            if (!user) {
                return res.json({ success: false, message: 'Невірний логін' });
            }

            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.json({ success: false, message: 'Невірний пароль' });
            }

            req.session.user = user;

            res.json({ success: true });
        }
    );
});

app.get('/me', (req, res) => {
    res.json(req.session.user || null);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

/* =========================
   TRAINERS
========================= */

app.get('/trainers', (req, res) => {
    db.all(`SELECT * FROM trainers`, [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.json(rows);
    });
});

/* =========================
   SLOTS + BOOKINGS (OLD SYSTEM)
========================= */

app.post('/generate-slots', (req, res) => {
    const { trainer_id } = req.body;

    const dates = ['2026-06-01', '2026-06-02'];
    const times = ['10:00', '12:00', '14:00'];

    dates.forEach(date => {
        times.forEach(time => {
            db.run(
                `INSERT INTO slots (trainer_id, date, time) VALUES (?, ?, ?)`,
                [trainer_id, date, time]
            );
        });
    });

    res.send('Слоти створені');
});

app.get('/slots/:trainerId', (req, res) => {
    db.all(
        `SELECT * FROM slots WHERE trainer_id = ? AND is_booked = 0`,
        [req.params.trainerId],
        (err, rows) => {
            res.json(rows);
        }
    );
});

app.post('/book', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Не авторизований');
    }

    const { slot_id } = req.body;
    const userId = req.session.user.id;

    db.get(`SELECT * FROM slots WHERE id = ?`, [slot_id], (err, slot) => {

        if (!slot || slot.is_booked) {
            return res.send('Слот зайнятий');
        }

        db.run(
            `INSERT INTO bookings (user_id, trainer_id, date, time)
             VALUES (?, ?, ?, ?)`,
            [userId, slot.trainer_id, slot.date, slot.time]
        );

        db.run(
            `UPDATE slots SET is_booked = 1 WHERE id = ?`,
            [slot_id]
        );

        res.send('Запис успішний');
    });
});

/* =========================
   BOOKINGS (NEW FIXED SYSTEM)
========================= */

app.get("/my-bookings", (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    db.all(
        `SELECT bookings.*, trainers.name
         FROM bookings
         JOIN trainers ON bookings.trainer_id = trainers.id
         WHERE user_id = ?`,
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

/* FIXED upload route */
app.post("/bookings", upload.single("image"), (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    const { trainer_name, specialty, date, time } = req.body;
    const image = req.file ? "/uploads/" + req.file.filename : null;

    db.run(
        `INSERT INTO bookings (user_id, trainer_id, date, time, image)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, 0, date, time, image],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.delete("/bookings/:id", (req, res) => {
    const userId = req.session.user?.id;

    db.run(
        "DELETE FROM bookings WHERE id = ? AND user_id = ?",
        [req.params.id, userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true });
        }
    );
});

app.post("/bookings/:id/like", (req, res) => {
    const userId = req.session.user?.id;
    const bookingId = req.params.id;

    db.get(
        "SELECT * FROM booking_likes WHERE user_id = ? AND booking_id = ?",
        [userId, bookingId],
        (err, row) => {

            if (row) {
                db.run(
                    "DELETE FROM booking_likes WHERE id = ?",
                    [row.id],
                    () => res.json({ liked: false })
                );
            } else {
                db.run(
                    "INSERT INTO booking_likes (user_id, booking_id) VALUES (?, ?)",
                    [userId, bookingId],
                    () => res.json({ liked: true })
                );
            }
        }
    );
});

/* =========================
   REVIEWS
========================= */

app.post('/review', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Логін потрібен');
    }

    const { trainer_id, rating, comment } = req.body;

    db.run(
        `INSERT INTO reviews (user_id, trainer_id, rating, comment)
         VALUES (?, ?, ?, ?)`,
        [req.session.user.id, trainer_id, rating, comment]
    );

    res.send('Відгук додано');
});

app.get('/reviews/:trainerId', (req, res) => {
    db.all(
        `SELECT reviews.*, users.username
         FROM reviews
         JOIN users ON reviews.user_id = users.id
         WHERE trainer_id = ?`,
        [req.params.trainerId],
        (err, rows) => {
            res.json(rows);
        }
    );
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "profile.html"));
});


app.post("/bookings", upload.single("image"), (req, res) => {

    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).send("Не авторизований");
    }

    const { date, time } = req.body;
    const image = req.file ? "/uploads/" + req.file.filename : null;

    db.run(
        `INSERT INTO bookings (user_id, trainer_id, date, time, image)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, 0, date, time, image],
        function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send("DB error");
            }

            res.json({ id: this.lastID });
        }
    );
});


app.post("/bookings", (req, res) => {

    if (!req.session.user) {
        return res.status(401).send("Логін потрібен");
    }

    const { trainer_name, specialty, date, time } = req.body;

    db.run(
        `INSERT INTO bookings (user_id, trainer_name, specialty, date, time)
         VALUES (?, ?, ?, ?, ?)`,
        [req.session.user.id, trainer_name, specialty, date, time],
        function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send("DB error");
            }

            res.json({ id: this.lastID });
        }
    );
});

app.get("/bookings", (req, res) => {

    if (!req.session.user) {
        return res.status(401).send("Логін потрібен");
    }

    db.all(
        `SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC`,
        [req.session.user.id],
        (err, rows) => {

            if (err) {
                return res.status(500).send("DB error");
            }

            res.json(rows);
        }
    );
});

app.delete("/bookings/:id", (req, res) => {

    if (!req.session.user) {
        return res.status(401).send("Логін потрібен");
    }

    db.run(
        `DELETE FROM bookings WHERE id = ? AND user_id = ?`,
        [req.params.id, req.session.user.id],
        (err) => {

            if (err) {
                return res.status(500).send("DB error");
            }

            res.json({ ok: true });
        }
    );
});

/* =========================
   MEALS
========================= */

// Отримати всі записи користувача
app.get('/api/meals', (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            error: 'Не авторизований'
        });
    }

    db.all(
        `SELECT * FROM meals
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [req.session.user.id],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Додати продукт
app.post('/api/meals', (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            error: 'Не авторизований'
        });
    }

    const {
        category,
        food_name,
        grams,
        calories,
        proteins,
        fats,
        carbs
    } = req.body;

    db.run(
        `INSERT INTO meals
        (
            user_id,
            category,
            food_name,
            grams,
            calories,
            proteins,
            fats,
            carbs
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            req.session.user.id,
            category,
            food_name,
            grams,
            calories,
            proteins,
            fats,
            carbs
        ],
        function(err){

            if(err){
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success:true,
                id:this.lastID
            });

        }
    );
});

// Видалити продукт
app.delete('/api/meals/:id', (req, res) => {

    db.run(
        `DELETE FROM meals
         WHERE id = ?
         AND user_id = ?`,
        [
            req.params.id,
            req.session.user.id
        ],
        function(err){

            if(err){
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success:true
            });

        }
    );
});



/* =========================
   START SERVER
========================= */

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
});