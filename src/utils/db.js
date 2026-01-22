import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { join } from "node:path";

export const db = await open({
  filename: join(process.cwd(), "db.sqlite"),
  driver: sqlite3.Database,
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER ,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id)
  )`);

// Seed two users
await db.run(`
  INSERT OR IGNORE INTO users (name, email, password)
  VALUES 
    ('user1', 'user1@gmail.com', '123'),
    ('user2', 'user2@gmail.com', '123')
`);

console.log("Database ready with users seeded.");

export default db;
