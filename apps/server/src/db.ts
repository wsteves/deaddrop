import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: any;
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
    price INTEGER,
    salaryMin INTEGER,
    salaryMax INTEGER,
    category TEXT,
    region TEXT,
    seller TEXT NOT NULL,
    employmentType TEXT,
    level TEXT,
    remote INTEGER DEFAULT 0,
    tags TEXT,
    contact TEXT,
    benefits TEXT,
    images TEXT NOT NULL,
    createdAt INTEGER NOT NULL
    );
  `);
  // Safe migrations for missing columns
  try { db.run('ALTER TABLE listings ADD COLUMN blockHash TEXT'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN blockNumber INTEGER'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN commitHash TEXT'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN salaryMin INTEGER'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN salaryMax INTEGER'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN employmentType TEXT'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN level TEXT'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN remote INTEGER'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN tags TEXT'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN contact TEXT'); } catch {}
  try { db.run('ALTER TABLE listings ADD COLUMN benefits TEXT'); } catch {}
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
