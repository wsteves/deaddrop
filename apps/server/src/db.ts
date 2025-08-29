
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db;
const dbFile = process.env.DB_FILE || './data/app.db';
const dir = path.dirname(dbFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function loadDatabase() {
  const SQL = await initSqlJs({});
  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    saveDatabase();
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT,
      region TEXT,
      seller TEXT NOT NULL,
      images TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      commitHash TEXT
    );
  `);
}


function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFile, buffer);
  }
}

function getDb() {
  if (!db) throw new Error('Database not loaded');
  return db;
}

export { getDb, loadDatabase, saveDatabase };
