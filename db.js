const sqlite3 = require('sqlite3').verbose();

// Connect to or create the database file
const db = new sqlite3.Database('./kerala_tourism.db', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
  }
});

// Create tables if they don’t exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placeId TEXT,
    name TEXT,
    comment TEXT
  )`);
});

module.exports = db;
