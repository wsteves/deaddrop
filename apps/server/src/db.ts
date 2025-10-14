import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  await createTables();
}

async function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      walletAddress TEXT UNIQUE,
      displayName TEXT,
      profileImage TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS storage (
      id TEXT PRIMARY KEY,
      cid TEXT NOT NULL,
      filename TEXT,
      mimeType TEXT,
      size INTEGER,
      uploadedBy TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (uploadedBy) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      recipientId TEXT NOT NULL,
      storageId TEXT,
      sealedKey TEXT,
      subject TEXT,
      snippet TEXT,
      isRead INTEGER DEFAULT 0,
      deliveredAt INTEGER,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (senderId) REFERENCES users(id),
      FOREIGN KEY (recipientId) REFERENCES users(id),
      FOREIGN KEY (storageId) REFERENCES storage(id)
    );
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipientId);');
  db.run('CREATE INDEX IF NOT EXISTS idx_storage_cid ON storage(cid);');
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

export function addStorageEntry(payload: { cid: string; filename?: string; mimeType?: string; size?: number; uploadedBy?: string }) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const stmt = db.prepare(`INSERT INTO storage (id, cid, filename, mimeType, size, uploadedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(id, payload.cid, payload.filename || null, payload.mimeType || null, payload.size || null, payload.uploadedBy || null, now);
  return getStorageById(id);
}

export function getStorageById(id: string) {
  const stmt = db.prepare('SELECT * FROM storage WHERE id = ?');
  return stmt.get(id);
}

export function getStorageByCid(cid: string) {
  const stmt = db.prepare('SELECT * FROM storage WHERE cid = ?');
  return stmt.get(cid);
}

export function ensureUser(walletAddress: string, displayName?: string) {
  const existing = db.prepare('SELECT * FROM users WHERE walletAddress = ?').get(walletAddress);
  if (existing) return existing;
  const id = crypto.randomUUID();
  const now = Date.now();
  const stmt = db.prepare('INSERT INTO users (id, walletAddress, displayName, profileImage, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, walletAddress, displayName || null, null, now, now);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserById(id: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

export function createMessage(data: any) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const stmt = db.prepare(`INSERT INTO messages (id, senderId, recipientId, storageId, sealedKey, subject, snippet, isRead, deliveredAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(id, data.senderId, data.recipientId, data.storageId || null, data.sealedKey || null, data.subject || null, data.snippet || null, 0, data.deliveredAt || null, now);
  return getMessageById(id);
}

export function getMessagesForUser(userId: string, limit: number = 50, page: number = 1) {
  const offset = (page - 1) * limit;
  const stmt = db.prepare('SELECT * FROM messages WHERE recipientId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?');
  return stmt.all(userId, limit, offset);
}

export function getMessageById(id: string) {
  const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
  return stmt.get(id);
}

export function markMessageRead(id: string) {
  const stmt = db.prepare('UPDATE messages SET isRead = 1 WHERE id = ?');
  stmt.run(id);
  return getMessageById(id);
}

export { getDb, loadDatabase, saveDatabase };
