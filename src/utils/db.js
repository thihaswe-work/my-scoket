// db.js (or wherever you setup SQLite)
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { join } from "node:path";

export const db = await open({
  filename: join(process.cwd(), "db.sqlite"),
  driver: sqlite3.Database,
});

// Users table
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Rooms table (private or group)
await db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Room-users relation table
await db.exec(`
  CREATE TABLE IF NOT EXISTS room_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Messages table
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  )
`);

// =========================
// SEED USERS
// =========================
await db.run(`
  INSERT OR IGNORE INTO users (name, email, password)
  VALUES 
    ('user1', 'user1@gmail.com', '123'),
    ('user2', 'user2@gmail.com', '123'),
    ('user3', 'user3@gmail.com', '123')
`);

console.log("Database ready with users and rooms seeded.");

export default db;
