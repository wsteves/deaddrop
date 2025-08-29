import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import { getDb, loadDatabase } from './db.js';
import { ListingCreateSchema } from './schemas.js';
import crypto from 'crypto';

// NEW: shared API instance (reused across requests)
let sharedApi: any | null = null;
async function getApi() {
  if (sharedApi) return sharedApi;
  const { ApiPromise, WsProvider } = await import('@polkadot/api');
  const provider = new WsProvider(process.env.POLKADOT_WS || 'wss://westend-rpc.polkadot.io');
  sharedApi = await ApiPromise.create({ provider });
  return sharedApi;
}

// NEW: helpers
const isHex = (s: string) => /^0x[0-9a-f]+$/i.test(s ?? '');
const normalizeHex = (s: string | null | undefined) => (s ? s.toLowerCase() : s);

// Polkadot remarks are `Bytes`. If you originally passed a JSON string, it will be hex here.
// Decode safely and try JSON.parse on the decoded string.
function decodeRemark(arg: any): { rawHex: string | null; text: string | null; json: any | null } {
  try {
    const raw = arg?.toString?.() ?? null;
    if (!raw) return { rawHex: null, text: null, json: null };
    if (isHex(raw)) {
      // lazy import to avoid top-level dependency
      const { hexToU8a, u8aToString } = require('@polkadot/util');
      const text = u8aToString(hexToU8a(raw));
      try {
        return { rawHex: raw, text, json: JSON.parse(text) };
      } catch {
        return { rawHex: raw, text, json: null };
      }
    } else {
      // Sometimes toString() may already be the plain text (rare)
      try {
        return { rawHex: null, text: raw, json: JSON.parse(raw) };
      } catch {
        return { rawHex: null, text: raw, json: null };
      }
    }
  } catch {
    return { rawHex: null, text: null, json: null };
  }
}

async function fetchRemarkByBlockHashAndExtrinsicHash(api: any, blockHash: string, extrinsicHash: string) {
  const signedBlock = await api.rpc.chain.getBlock(blockHash);
  const targetHash = normalizeHex(extrinsicHash);
  let idx = -1;

  for (let i = 0; i < signedBlock.block.extrinsics.length; i++) {
    const ext = signedBlock.block.extrinsics[i];
    const extHash = normalizeHex(ext.hash?.toHex?.());
    const isRemark = ext.method?.section === 'system' && ext.method?.method === 'remark';
    if (isRemark && extHash === targetHash) {
      idx = i;
      const decoded = decodeRemark(ext.method.args?.[0]);
      return {
        found: true,
        extrinsicIndex: i,
        extrinsicHash: extHash,
        blockHash: normalizeHex(blockHash),
        method: `${ext.method.section}.${ext.method.method}`,
        remarkHex: decoded.rawHex,
        remarkText: decoded.text,
        remarkJson: decoded.json,
      };
    }
  }

  return { found: false, extrinsicIndex: idx, extrinsicHash: targetHash, blockHash: normalizeHex(blockHash) };
}

async function main() {
  await loadDatabase();
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(formBody);

  // ---------------------------------------------------------------------------
  // UPDATED: On-chain listings endpoint (no recent-block scanning)
  // ---------------------------------------------------------------------------
  // Usage options:
  //   GET /api/listings/onchain?blockHash=0x..&extrinsicHash=0x..
  //   GET /api/listings/onchain?blockNumber=123456&extrinsicHash=0x..
  //   GET /api/listings/onchain?id=<listing-id>   (reads hashes from DB)
  app.get('/api/listings/onchain', async (req, reply) => {
    try {
      const api = await getApi();
      const { id, blockHash, blockNumber, extrinsicHash } = (req.query || {}) as any;

      let finalBlockHash: string | null = blockHash || null;
      let finalExtrinsicHash: string | null = extrinsicHash || null;

      // If id is given, source details from DB
      if (id && (!finalBlockHash || !finalExtrinsicHash)) {
        const row = getDb().prepare('SELECT blockHash, blockNumber, commitHash as extrinsicHash FROM listings WHERE id = ?').get(id);
        if (!row) return reply.code(404).send({ error: 'Listing not found' });
        finalBlockHash = finalBlockHash || row.blockHash || null;

        // If blockNumber is present but we don’t have the hash, derive it
        if (!finalBlockHash && row.blockNumber != null) {
          finalBlockHash = (await api.rpc.chain.getBlockHash(row.blockNumber)).toHex();
        }

        finalExtrinsicHash = finalExtrinsicHash || row.extrinsicHash || null;
      }

      // Or if blockNumber provided explicitly and no blockHash, derive it
      if (!finalBlockHash && blockNumber != null) {
        const bh = await getApi().then(a => a.rpc.chain.getBlockHash(Number(blockNumber)));
        finalBlockHash = bh.toHex();
      }

      if (!finalBlockHash || !finalExtrinsicHash) {
        return reply.code(400).send({
          error: 'Missing identifiers',
          details: 'Provide either (blockHash & extrinsicHash), or (blockNumber & extrinsicHash), or listing id.'
        });
      }

      const result = await fetchRemarkByBlockHashAndExtrinsicHash(api, finalBlockHash, finalExtrinsicHash);
      if (!result.found) {
        return reply.code(404).send({
          error: 'Remark not found for the given block/extrinsic',
          details: { blockHash: result.blockHash, extrinsicHash: result.extrinsicHash }
        });
      }

      // If the remark JSON “looks like” your listing format, return it directly with some metadata
      const payload = {
        ok: true,
        blockHash: result.blockHash,
        extrinsicHash: result.extrinsicHash,
        extrinsicIndex: result.extrinsicIndex,
        method: result.method,
        remarkHex: result.remarkHex,
        remarkText: result.remarkText,
        listing: result.remarkJson && result.remarkJson.id && result.remarkJson.title ? result.remarkJson : null,
        rawJson: result.remarkJson ?? null
      };

      return reply.send(payload);
    } catch (err) {
      return reply
        .code(500)
        .send({ error: 'Failed to fetch on-chain listing remark', details: (err as any)?.message ?? String(err) });
    }
  });

  // ---------------------------------------------------------------------------
  // The rest of your routes stay the same, but 2 small polish items below:
  // ---------------------------------------------------------------------------

  // (1) When posting a listing, keep what you already have,
  // but normalize stored hashes to lowercase for stable comparisons:
  //   commitHash = commitHash?.toLowerCase();
  //   blockHash = blockHash?.toLowerCase();
  // and store `blockNumber` when you have it (you already do this).

  // (2) Optionally, expose a convenience endpoint to fetch on-chain for a listing:
  app.get('/api/listings/:id/onchain', async (req, reply) => {
    const { id } = req.params as any;
    // Proxy to the generic endpoint by id
    req.query = { id } as any;
    return (app as any).routes['GET:/api/listings/onchain']?.handler(req, reply) // Fastify internals differ; simplest is just to re-run logic
      ?? reply.code(400).send({ error: 'Route wiring error' });
  });

  // --- your existing health/listings CRUD routes unchanged below ---
  // (keep your existing /api/health, /api/listings, /api/listings/:id, /api/listings POST, etc.)
  // NOTE: don’t forget to keep your current code here.



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
      let blockHash = null;
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
              blockHash = status.asInBlock.toHex();
              resolve(true);
            }
          });
        });
        await api.disconnect();
      } catch (err) {
        commitHash = null;
        blockHash = null;
        req.log.error('Polkadot remark failed: ' + (err && (err as any).toString ? (err as any).toString() : String(err)));
      }
      // Update DB with commitHash and blockHash
      if (commitHash && blockHash) {
        // Get block number from blockHash
        let blockNumber = null;
        try {
          const { ApiPromise, WsProvider } = await import('@polkadot/api');
          const provider = new WsProvider(POLKADOT_WS);
          const api = await ApiPromise.create({ provider });
          const header = await api.rpc.chain.getHeader(blockHash);
          blockNumber = header.number.toNumber();
          await api.disconnect();
        } catch (err) {
          req.log.error('Failed to fetch block number for blockHash', blockHash, err);
        }
        getDb().prepare('UPDATE listings SET commitHash = ?, blockHash = ?, blockNumber = ? WHERE id = ?').run(commitHash, blockHash, blockNumber, id);
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
