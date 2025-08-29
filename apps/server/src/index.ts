import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import { getDb, loadDatabase } from './db.js';
import { ListingCreateSchema } from './schemas.js';
import crypto from 'crypto';


async function main() {
  await loadDatabase();
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(formBody);

  // Set default chain to Westend
  const POLKADOT_WS = process.env.POLKADOT_WS || 'wss://westend-rpc.polkadot.io';
  // Fetch recent listings from chain remarks
  app.get('/api/listings/onchain', async (req, reply) => {
    try {
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const provider = new WsProvider(POLKADOT_WS);
      const api = await ApiPromise.create({ provider });
      // Get latest 100 blocks
      const latest = await api.rpc.chain.getHeader();
      const listings: any[] = [];
      for (let i = 0; i < 100; i++) {
        const blockHash = await api.rpc.chain.getBlockHash(latest.number.toNumber() - i);
        const block = await api.rpc.chain.getBlock(blockHash);
        for (const ex of block.block.extrinsics) {
          if (ex.method.section === 'system' && ex.method.method === 'remark') {
            try {
              const remark = ex.method.args[0].toString();
              if (remark) {
                try {
                  const data = JSON.parse(remark);
                  if (data && data.id && data.title) {
                    listings.push(data);
                  }
                } catch {}
              }
            } catch {}
          }
        }
      }
      await api.disconnect();
      return listings;
    } catch (err) {
  reply.code(500).send({ error: 'Failed to fetch on-chain listings', details: (err && (err as any).message) || String(err) });
    }
  });

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
    const stmt = getDb().prepare(sql);
    if (params.length) stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      row.images = JSON.parse(row.images);
      rows.push(row);
    }
    stmt.free();
    return rows;
  });

  app.get('/api/listings/:id', async (req, reply) => {
    const { id } = req.params as any;
    const stmt = getDb().prepare('SELECT * FROM listings WHERE id = ?');
    stmt.bind([id]);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
      row.images = JSON.parse(row.images);
    }
    stmt.free();
    if (!row) return reply.code(404).send({ error: 'Not found' });
    return row;
  });

  app.post('/api/listings', async (req, reply) => {
    try {
      const parsed = ListingCreateSchema.safeParse(req.body);
      req.log.info({ body: req.body, parsed });
      if (!parsed.success) {
        req.log.warn({ error: parsed.error.flatten() });
        return reply.code(400).send({ error: parsed.error.flatten() });
      }
      const input = parsed.data;
      const id = crypto.randomUUID();
      const createdAt = Date.now();
      // Debug log all values before insert
      req.log.info({
        id, title: input.title, description: input.description, price: input.price, category: input.category, region: input.region, seller: input.seller, images: input.images, createdAt
      });
      // Explicit undefined/null check
      if ([id, input.title, input.description, input.price, input.category, input.region, input.seller, input.images, createdAt].some(v => v === undefined || v === null)) {
        req.log.error('One or more fields are undefined or null');
        return reply.code(400).send({ error: 'One or more fields are undefined or null', details: { id, title: input.title, description: input.description, price: input.price, category: input.category, region: input.region, seller: input.seller, images: input.images, createdAt } });
      }
      // Use positional parameters for SQL.js insert
      const insertSql = `INSERT INTO listings (id, title, description, price, category, region, seller, images, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [id, input.title, input.description, input.price, input.category, input.region, input.seller, JSON.stringify(input.images), createdAt];
      req.log.info({ insertSql, values });
      getDb().prepare(insertSql).run(values);
      let commitHash = null;
      try {
        const { ApiPromise, WsProvider } = await import('@polkadot/api');
        const provider = new WsProvider(POLKADOT_WS);
        const api = await ApiPromise.create({ provider });
        const { Keyring } = await import('@polkadot/keyring');
        const keyring = new Keyring({ type: 'sr25519' });
        const dev = keyring.addFromUri('//Alice');
        const remark = JSON.stringify({ id, ...input, createdAt });
        const tx = api.tx.system.remark(remark);
        await new Promise((resolve, reject) => {
          tx.signAndSend(dev, ({ status, txHash, dispatchError }) => {
            if (dispatchError) {
              reject(dispatchError.toString());
            }
            if (status.isInBlock) {
              commitHash = txHash.toHex();
              resolve(true);
            }
          });
        });
        await api.disconnect();
      } catch (err) {
        commitHash = null;
        req.log.error('Polkadot remark failed: ' + (err && (err as any).toString ? (err as any).toString() : String(err)));
      }
      // Update DB with commitHash
      if (commitHash) {
        getDb().prepare('UPDATE listings SET commitHash = ? WHERE id = ?').run(commitHash, id);
        const { saveDatabase } = await import('./db.js');
        saveDatabase();
      }
      // Return full listing
      const stmt = getDb().prepare('SELECT * FROM listings WHERE id = ?');
      stmt.bind([id]);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
        row.images = JSON.parse(row.images);
      }
      stmt.free();
      return reply.send(row);
    } catch (err: any) {
      req.log.error(err);
      reply.code(500).send({ error: 'Internal server error', details: err.message || String(err) });
    }
  });

  app.post('/api/listings/:id/commit', async (req, reply) => {
    const { id } = req.params as any;
    const { commitHash } = (req.body || {}) as any;
    if (!commitHash) return reply.code(400).send({ error: 'commitHash required' });
    const row = getDb().prepare('SELECT id FROM listings WHERE id = ?').get(id);
    if (!row) return reply.code(404).send({ error: 'Not found' });
  getDb().prepare('UPDATE listings SET commitHash = ? WHERE id = ?').run(commitHash, id);
  const { saveDatabase } = await import('./db.js');
  saveDatabase();
  return { ok: true };
  });

  const port = parseInt(process.env.PORT || '4000', 10);
  app.listen({ port, host: '0.0.0.0' }).then(() => {
    app.log.info(`Server running on http://localhost:${port}`);
  });
}

main();
