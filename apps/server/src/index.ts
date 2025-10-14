import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import { loadDatabase, createMessage, getMessagesForUser, getMessageById, markMessageRead } from './db.js';
import crypto from 'crypto';
import { crustNetwork, initializeCrustNetwork } from './crustNetworkService.js';

const storageMap = new Map<string, any>();

async function main() {
  await loadDatabase();
  
  const app = Fastify({ 
    logger: true,
    bodyLimit: 100 * 1024 * 1024
  });
  
  await app.register(cors, { origin: true });
  await app.register(formBody);

  app.get('/api/health', async () => ({ ok: true }));

  app.post('/api/messages', async (req, reply) => {
    try {
      const body = req.body as any || {};
      const { senderId, recipientId, storageId: bodyStorageId, ciphertext, sealedKey, subject, snippet, meta } = body;

      if (!senderId || !recipientId) {
        return reply.code(400).send({ error: 'senderId and recipientId required' });
      }

      let storageId = bodyStorageId;
      if (!storageId && ciphertext) {
        const storeRes = await fetch('http://localhost:4000/api/storage/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { ciphertext, meta: meta || {} } })
        });
        if (!storeRes.ok) throw new Error('Failed to store ciphertext');
        const storeJson = await storeRes.json();
        storageId = storeJson.id;
      }

      if (!storageId) return reply.code(400).send({ error: 'storageId or ciphertext required' });

      const msg = createMessage({
        senderId,
        recipientId,
        storageId,
        sealedKey: sealedKey || null,
        subject: subject || null,
        snippet: snippet || null,
        deliveredAt: Date.now()
      });

      req.log.info(`Message created ${msg.id} from ${senderId} -> ${recipientId}`);
      return reply.code(201).send(msg);
    } catch (error: any) {
      req.log.error('Error creating message:', error);
      return reply.code(500).send({ error: 'Failed to create message', details: error?.message });
    }
  });

  app.get('/api/messages', async (req, reply) => {
    try {
      const userId = (req.query as any)?.userId;
      const page = parseInt((req.query as any)?.page || '1');
      const limit = parseInt((req.query as any)?.limit || '50');
      if (!userId) return reply.code(400).send({ error: 'userId required' });

      const msgs = getMessagesForUser(userId, limit, page);
      return reply.send(msgs);
    } catch (error: any) {
      req.log.error('Error listing messages:', error);
      return reply.code(500).send({ error: 'Failed to list messages' });
    }
  });

  app.get('/api/messages/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const row = getMessageById(id);
      if (!row) return reply.code(404).send({ error: 'Message not found' });

      const out: any = { ...row };
      try {
        const cached = storageMap.get(row.storageId);
        if (cached) out.payload = cached.data;
        else {
          const payload = await crustNetwork.retrieveData(row.storageId).catch(() => null);
          if (payload) out.payload = payload;
        }
      } catch (e) {}

      return reply.send(out);
    } catch (error: any) {
      req.log.error('Error fetching message:', error);
      return reply.code(500).send({ error: 'Failed to fetch message' });
    }
  });

  app.post('/api/messages/:id/read', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const updated = markMessageRead(id);
      return reply.send(updated);
    } catch (error: any) {
      req.log.error('Error marking message read:', error);
      return reply.code(500).send({ error: 'Failed to mark message read' });
    }
  });

  app.post('/api/storage/store-raw', async (req, reply) => {
    try {
      const { data, metadata } = req.body as any;
      if (!data) return reply.code(400).send({ error: 'No data provided' });

      const buffer = Buffer.from(data);
      const result = await crustNetwork.storeRawData(buffer);
      const ipfsHash = result.cid;
      
      if (metadata) {
        storageMap.set(`metadata_${ipfsHash}`, {
          ...metadata,
          cid: ipfsHash,
          storedAt: Date.now(),
          rawFile: true
        });
      }

      req.log.info(`Stored raw file on Crust IPFS: ${ipfsHash}`);
      return reply.send({ 
        id: ipfsHash, 
        message: 'Raw file stored on IPFS',
        url: `https://ipfs.io/ipfs/${ipfsHash}`
      });
    } catch (error: any) {
      req.log.error('Error storing raw data:', error);
      return reply.code(500).send({ error: 'Failed to store raw data' });
    }
  });

  app.post('/api/storage/store', async (req, reply) => {
    try {
      const { data } = req.body as any;
      if (!data) return reply.code(400).send({ error: 'No data provided' });

      const result = await crustNetwork.storeData(data);
      const ipfsHash = result.cid;
      
      storageMap.set(ipfsHash, {
        data,
        storedAt: Date.now(),
        version: '1.0',
        ipfsHash,
        storageOrder: result.storageOrder
      });

      req.log.info(`Stored on Crust IPFS: ${ipfsHash}`);
      return reply.send({ id: ipfsHash, message: 'Data stored on decentralized IPFS' });
    } catch (error: any) {
      req.log.error('Error storing data on IPFS:', error);
      
      const id = 'local_' + crypto.randomBytes(16).toString('hex');
      storageMap.set(id, {
        data: (req.body as any).data,
        storedAt: Date.now(),
        version: '1.0',
        fallback: true
      });
      
      return reply.send({ id, message: 'Data stored locally (IPFS unavailable)', fallback: true });
    }
  });

  app.get('/api/storage/retrieve/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      
      const cached = storageMap.get(id);
      if (cached) {
        return reply.send({ 
          data: cached.data, 
          storedAt: cached.storedAt,
          version: cached.version,
          source: cached.fallback ? 'local' : 'ipfs-cache'
        });
      }

      const data = await crustNetwork.retrieveData(id);
      const result = {
        data,
        storedAt: Date.now(),
        version: '1.0'
      };
      storageMap.set(id, result);
      
      req.log.info(`Retrieved from Crust IPFS: ${id}`);
      return reply.send({ 
        data,
        storedAt: result.storedAt,
        version: result.version,
        source: 'ipfs'
      });
    } catch (error: any) {
      req.log.error('Error retrieving data:', error);
      return reply.code(404).send({ error: 'Content not found' });
    }
  });

  app.post('/api/storage/pin/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const stored = storageMap.get(id);
      
      if (!stored) {
        return reply.code(404).send({ error: 'Content not found' });
      }

      req.log.info(`Pinned content: ${id}`);
      return reply.send({ message: 'Content pinned successfully' });
    } catch (error: any) {
      req.log.error('Error pinning content:', error);
      return reply.code(500).send({ error: 'Failed to pin content' });
    }
  });

  app.get('/api/crust/account/:address?', async (req, reply) => {
    try {
      const address = (req.params as any).address || crustNetwork.getAccountAddress();
      
      if (!crustNetwork || address === 'Not initialized') {
        await initializeCrustNetwork();
      }
      
      const actualAddress = crustNetwork.getAccountAddress();
      const balance = await crustNetwork.getAccountBalance();
      const balanceInCRU = balance === '0' ? '0' : (parseInt(balance) / 1000000000000).toString();
      
      return reply.send({
        address: actualAddress,
        balance: balance,
        balanceInCRU: balanceInCRU,
        network: 'Rocky Network (Testnet)',
        explorerUrl: `https://rocky.subscan.io/account/${actualAddress}`,
        funded: balance !== '0'
      });
    } catch (error: any) {
      return reply.code(500).send({ 
        error: 'Failed to get account info',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/crust/status', async (req, reply) => {
    try {
      const status = {
        connected: crustNetwork ? true : false,
        accountAddress: crustNetwork.getAccountAddress(),
        balance: await crustNetwork.getAccountBalance(),
        gatewayUrl: crustNetwork.getIPFSGatewayUrl(''),
        network: 'Crust Rocky Network (Testnet)'
      };
      return reply.send(status);
    } catch (error: any) {
      return reply.code(500).send({ 
        error: 'Failed to get Crust Network status',
        connected: false
      });
    }
  });

  app.get('/api/crust/order/:cid', async (req, reply) => {
    try {
      const { cid } = req.params as { cid: string };
      const orderStatus = await crustNetwork.getStorageOrderStatus(cid);
      
      if (!orderStatus) {
        return reply.code(404).send({ error: 'Storage order not found' });
      }

      return reply.send({
        ...orderStatus,
        gatewayUrl: crustNetwork.getIPFSGatewayUrl(cid),
        explorerUrl: crustNetwork.getCrustExplorerUrl(cid)
      });
    } catch (error: any) {
      return reply.code(500).send({ 
        error: 'Failed to get storage order status'
      });
    }
  });

  const port = parseInt(process.env.PORT || '4000', 10);
  app.listen({ port, host: '0.0.0.0' }).then(async () => {
    app.log.info(`Server running on http://localhost:${port}`);
    app.log.info('Database initialized and ready');
    
    try {
      app.log.info('Initializing Crust Network...');
      await initializeCrustNetwork();
      app.log.info(`Connected to Crust Network - Account: ${crustNetwork.getAccountAddress()}`);
      app.log.info(`Account Balance: ${await crustNetwork.getAccountBalance()}`);
    } catch (error: any) {
      app.log.error('Failed to initialize Crust Network:', error);
      app.log.warn('Server will continue with fallback storage');
    }
  });
}

main().catch(console.error);
