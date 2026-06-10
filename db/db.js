import sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();

// База (один файл, без магії)
const db = new sqlite.Database('./database.sqlite');

export default db;

/* =========================
   USERS
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
});

/* =========================
   TRAINERS
========================= */
db.serialize(() => {
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
});

/* =========================
   SLOTS
========================= */
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trainer_id INTEGER,
            date TEXT,
            time TEXT,
            is_booked INTEGER DEFAULT 0
        )
    `);
});

/* =========================
   BOOKINGS
========================= */
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            trainer_id INTEGER,
            date TEXT,
            time TEXT
        )
    `);
});

/* =========================
   REVIEWS
========================= */
db.serialize(() => {
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

db.run(`
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    food_name TEXT NOT NULL,
    grams REAL DEFAULT 0,
    calories REAL DEFAULT 0,
    proteins REAL DEFAULT 0,
    fats REAL DEFAULT 0,
    carbs REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
