
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import { db } from './db.js';
import { ListingCreateSchema } from './schemas.js';
import crypto from 'crypto';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(formBody);

app.get('/api/health', async () => ({ ok: true }));

app.get('/api/listings', async (req, reply) => {
  const { q = '', region = '', category = '', cursor = '', limit = '20' } = req.query as any;
  const lim = Math.min(parseInt(limit) || 20, 50);
  let sql = 'SELECT * FROM listings WHERE 1=1';
  const params: any[] = [];
  if (q) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (region) { sql += ' AND region = ?'; params.push(region); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (cursor) { sql += ' AND createdAt < ?'; params.push(parseInt(cursor)); }
  sql += ' ORDER BY createdAt DESC LIMIT ?';
  params.push(lim);
  const rows = db.prepare(sql).all(...params);
  return rows.map((r: any) => ({ ...r, images: JSON.parse(r.images) }));
});

app.get('/api/listings/:id', async (req, reply) => {
  const { id } = req.params as any;
  const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  if (!row) return reply.code(404).send({ error: 'Not found' });
  row.images = JSON.parse(row.images);
  return row;
});

app.post('/api/listings', async (req, reply) => {
  const parsed = ListingCreateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const input = parsed.data;
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  db.prepare(`INSERT INTO listings (id, title, description, price, category, region, seller, images, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.title, input.description, input.price, input.category, input.region, input.seller, JSON.stringify(input.images), createdAt);
  return { id, createdAt };
});

app.post('/api/listings/:id/commit', async (req, reply) => {
  const { id } = req.params as any;
  const { commitHash } = (req.body || {}) as any;
  if (!commitHash) return reply.code(400).send({ error: 'commitHash required' });
  const row = db.prepare('SELECT id FROM listings WHERE id = ?').get(id);
  if (!row) return reply.code(404).send({ error: 'Not found' });
  db.prepare('UPDATE listings SET commitHash = ? WHERE id = ?').run(commitHash, id);
  return { ok: true };
});

const port = parseInt(process.env.PORT || '4000', 10);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`Server running on http://localhost:${port}`);
});
