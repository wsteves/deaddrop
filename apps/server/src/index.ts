import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import { getDb, loadDatabase, getAllJobs, getJobById, createJob, searchJobs, getUserById, createUser, updateUser, deleteUser, getCompanyById, createCompany, updateCompany, deleteCompany, getUserSkills, addUserSkill, updateUserSkill, deleteUserSkill, getUserWorkExperience, addWorkExperience, updateWorkExperience, deleteWorkExperience, getUserEducation, addEducation, updateEducation, deleteEducation, getJobApplications, createApplication, updateApplication, getApplicationById, getUserApplications, saveJob, unsaveJob, getUserSavedJobs, createMessage, getMessagesForUser, getMessageById, markMessageRead } from './db.js';
import { JobCreateSchema, JobUpdateSchema, UserCreateSchema, UserUpdateSchema, CompanyCreateSchema, CompanyUpdateSchema, UserSkillCreateSchema, WorkExperienceCreateSchema, EducationCreateSchema, ApplicationCreateSchema, ListingCreateSchema } from './schemas.js';
import crypto from 'crypto';
import { crustNetwork, initializeCrustNetwork } from './crustNetworkService.js';

// Shared API instance (reused across requests)
let sharedApi: any | null = null;
async function getApi() {
  if (sharedApi) return sharedApi;
  const { ApiPromise, WsProvider } = await import('@polkadot/api');
  const provider = new WsProvider(process.env.POLKADOT_WS || 'wss://westend-rpc.polkadot.io');
  sharedApi = await ApiPromise.create({ provider });
  return sharedApi;
}

// Helpers
const isHex = (s: string) => /^[0-9a-f]+$/i.test(s ?? '');
const normalizeHex = (s: string | null | undefined) => (s ? s.toLowerCase() : s);

function normalizeRow(row: any) {
  if (!row) return row;
  try {
    if (row.images && typeof row.images === 'string') {
      row.images = JSON.parse(row.images);
    }
  } catch { 
    row.images = []; 
  }
  
  // Handle skills, tags, techStack arrays
  ['skills', 'tags', 'techStack', 'benefits', 'technologies', 'achievements'].forEach(field => {
    if (row[field] && typeof row[field] === 'string') {
      try {
        row[field] = JSON.parse(row[field]);
      } catch {
        row[field] = [];
      }
    }
  });

  // Convert numeric fields
  ['price', 'salary', 'salaryMin', 'salaryMax', 'equityMin', 'equityMax', 'blockNumber', 'viewCount', 'applicationCount', 'saveCount', 'preferredSalaryMin', 'preferredSalaryMax', 'yearsOfExperience', 'expectedSalary'].forEach(field => {
    if (row[field] != null) {
      row[field] = Number(row[field]);
    }
  });

  // Convert boolean fields
  ['remote', 'isRemote', 'isCurrent', 'isSponsored', 'isFeatured', 'isRemoteFriendly', 'isRemoteFirst', 'isVerified', 'emailVerified', 'isEndorsed'].forEach(field => {
    if (row[field] != null) {
      row[field] = Boolean(Number(row[field]));
    }
  });

  return row;
}

// Polkadot blockchain helpers
function decodeRemark(arg: any): { rawHex: string | null; text: string | null; json: any | null } {
  try {
    const raw = arg?.toString?.() ?? null;
    if (!raw) return { rawHex: null, text: null, json: null };
    if (isHex(raw)) {
      const { hexToU8a, u8aToString } = require('@polkadot/util');
      const text = u8aToString(hexToU8a(raw));
      try {
        return { rawHex: raw, text, json: JSON.parse(text) };
      } catch {
        return { rawHex: raw, text, json: null };
      }
    } else {
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

async function main() {
  await loadDatabase(); // This already initializes the database schema
  
  // Configure Fastify with 100MB body limit for file uploads
  const app = Fastify({ 
    logger: true,
    bodyLimit: 100 * 1024 * 1024 // 100 MB
  });
  await app.register(cors, { origin: true });
  await app.register(formBody);

  // Health check
  app.get('/api/health', async () => ({ ok: true }));

  // =============================================================================
  // JOB ENDPOINTS (Primary API)
  // =============================================================================

  // Get all jobs with filtering and pagination
  app.get('/api/jobs', async (req, reply) => {
    try {
      const query = (req.query as any)?.q;
      const category = (req.query as any)?.category;
      const location = (req.query as any)?.location;
      const remote = (req.query as any)?.remote;
      const employmentType = (req.query as any)?.employmentType;
      const experienceLevel = (req.query as any)?.experienceLevel;
      const salaryMin = (req.query as any)?.salaryMin;
      const salaryMax = (req.query as any)?.salaryMax;
      const skills = (req.query as any)?.skills;
      const companyId = (req.query as any)?.companyId;
      const page = parseInt((req.query as any)?.page || '1');
      const limit = parseInt((req.query as any)?.limit || '20');

      const filters = {
        query, category, location, remote: remote === 'true',
        employmentType, experienceLevel,
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        skills: skills ? skills.split(',') : undefined,
        companyId, page, limit
      };

      const jobs = query || category || location || remote || employmentType || experienceLevel || salaryMin || salaryMax || skills || companyId
        ? await searchJobs(filters)
        : await getAllJobs(page, limit);

      return reply.send(jobs.map(normalizeRow));
    } catch (error) {
      req.log.error('Error fetching jobs:', error);
      return reply.code(500).send({ error: 'Failed to fetch jobs' });
    }
  });

  // Get job by ID
  app.get('/api/jobs/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const job = await getJobById(id);
      
      if (!job) {
        return reply.code(404).send({ error: 'Job not found' });
      }
      
      return reply.send(normalizeRow(job));
    } catch (error) {
      req.log.error('Error fetching job:', error);
      return reply.code(500).send({ error: 'Failed to fetch job' });
    }
  });

  // =============================================================================
  // MESSAGING ENDPOINTS
  // =============================================================================

  // Create a message - expects either { storageId } pointing to previously stored ciphertext
  // or { ciphertext } which will be stored via /api/storage/store. Also expects senderId & recipientId.
  app.post('/api/messages', async (req, reply) => {
    try {
  const body = req.body || {};
  req.log.info('Incoming /api/messages body:', body);
      const senderId = body.senderId;
      const recipientId = body.recipientId;

      if (!senderId || !recipientId) {
        return reply.code(400).send({ error: 'senderId and recipientId required' });
      }

      let storageId = body.storageId;
      if (!storageId && body.ciphertext) {
        // store ciphertext on IPFS via storage endpoint
        const storeRes = await fetch('http://localhost:4000/api/storage/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { ciphertext: body.ciphertext, meta: body.meta || {} } })
        });
        if (!storeRes.ok) {
          throw new Error('Failed to store ciphertext');
        }
        const storeJson = await storeRes.json();
        storageId = storeJson.id;
      }

      if (!storageId) return reply.code(400).send({ error: 'storageId or ciphertext required' });

      // Create DB message record (sealedKey is recipient sealed symmetric key)
      const msg = createMessage({
        senderId,
        recipientId,
        storageId,
        sealedKey: body.sealedKey || null,
        subject: body.subject || null,
        snippet: body.snippet || null,
        deliveredAt: Date.now()
      });

      // Optionally, create a notification for recipient
      try {
        const noteStmt = getDb().prepare(`INSERT INTO notifications (id, userId, type, title, message, data, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        const nid = crypto.randomUUID();
        noteStmt.run(nid, recipientId, 'message', 'New message', `${body.subject || 'New message from a recruiter'}`, JSON.stringify({ messageId: msg.id }), Date.now());
      } catch (e) {
        req.log.warn('Failed to create notification for message:', e);
      }

      req.log.info(`Message created ${msg.id} from ${senderId} -> ${recipientId} storage=${storageId}`);
      return reply.code(201).send(msg);
    } catch (error:any) {
      req.log.error('Error creating message:', error);
      return reply.code(500).send({ error: 'Failed to create message', details: error?.message || String(error) });
    }
  });

  // List messages for a recipient
  app.get('/api/messages', async (req, reply) => {
    try {
      const userId = (req.query as any)?.userId;
      const page = parseInt((req.query as any)?.page || '1');
      const limit = parseInt((req.query as any)?.limit || '50');
      if (!userId) return reply.code(400).send({ error: 'userId required' });

      const msgs = getMessagesForUser(userId, limit, page).map(normalizeRow);
      return reply.send(msgs);
    } catch (error) {
      req.log.error('Error listing messages:', error);
      return reply.code(500).send({ error: 'Failed to list messages' });
    }
  });

  // debug endpoints removed

  // Get single message and optionally the ciphertext payload from storage
  app.get('/api/messages/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const row = getMessageById(id);
      if (!row) return reply.code(404).send({ error: 'Message not found' });

      const out: any = { ...row };
      // Try to fetch payload from storageMap or crustNetwork
      try {
        const cached = storageMap.get(row.storageId);
        if (cached) out.payload = cached.data;
        else {
          const payload = await crustNetwork.retrieveData(row.storageId).catch(() => null);
          if (payload) out.payload = payload;
        }
      } catch (e) {
        // ignore storage fetch errors
      }

      return reply.send(normalizeRow(out));
    } catch (error) {
      req.log.error('Error fetching message:', error);
      return reply.code(500).send({ error: 'Failed to fetch message' });
    }
  });

  // Mark message read
  app.post('/api/messages/:id/read', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const updated = markMessageRead(id);
      return reply.send(updated);
    } catch (error) {
      req.log.error('Error marking message read:', error);
      return reply.code(500).send({ error: 'Failed to mark message read' });
    }
  });

  // Create new job
  app.post('/api/jobs', async (req, reply) => {
    try {
      const body = req.body || {};
      const validatedData = JobCreateSchema.parse(body);
      
      // Extract postedBy from the original body before validation
      const postedBy = (body as any).postedBy || 'anonymous';
      
      const job = await createJob(validatedData, postedBy);
      return reply.code(201).send(normalizeRow(job));
    } catch (error) {
      req.log.error('Error creating job:', error);
      return reply.code(400).send({ 
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =============================================================================
  // DECENTRALIZED STORAGE ENDPOINTS
  // =============================================================================

  // Simple in-memory storage for development (replace with IPFS in production)
  const storageMap = new Map<string, any>();
  const jobStorageMap = new Map<string, string>(); // Maps job ID to storage ID

  // Store data on Crust IPFS
  // Store raw file (no JSON wrapper) - for public plain files
  app.post('/api/storage/store-raw', async (req, reply) => {
    try {
      const { data, metadata } = req.body as any;
      if (!data) {
        return reply.code(400).send({ error: 'No data provided' });
      }

      // Convert array of bytes back to Buffer for IPFS
      const buffer = Buffer.from(data);
      
      // Store raw bytes directly on IPFS (no JSON wrapper)
      const result = await crustNetwork.storeRawData(buffer);
      const ipfsHash = result.cid;
      
      // Store metadata separately for our app to retrieve
      if (metadata) {
        storageMap.set(`metadata_${ipfsHash}`, {
          ...metadata,
          cid: ipfsHash,
          storedAt: Date.now(),
          rawFile: true
        });
      }

      req.log.info(`🌐 Stored raw file on Crust IPFS: ${ipfsHash}`);
      return reply.send({ 
        id: ipfsHash, 
        message: 'Raw file stored on IPFS',
        url: `https://ipfs.io/ipfs/${ipfsHash}`
      });
    } catch (error) {
      req.log.error('Error storing raw data:', error);
      return reply.code(500).send({ error: 'Failed to store raw data' });
    }
  });

  app.post('/api/storage/store', async (req, reply) => {
    try {
      const { data } = req.body as any;
      if (!data) {
        return reply.code(400).send({ error: 'No data provided' });
      }

      // Store on Crust Network with real storage order
      const result = await crustNetwork.storeData(data);
      const ipfsHash = result.cid;
      
      // Also keep in local storage map for faster retrieval (cache)
      storageMap.set(ipfsHash, {
        data,
        storedAt: Date.now(),
        version: '1.0',
        ipfsHash,
        storageOrder: result.storageOrder
      });

      req.log.info(`🌐 Stored on Crust IPFS: ${ipfsHash}`);
      return reply.send({ id: ipfsHash, message: 'Data stored on decentralized IPFS' });
    } catch (error) {
      req.log.error('Error storing data on IPFS:', error);
      
      // Fallback to local storage if IPFS fails
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

  // Retrieve data
  // Retrieve data from Crust IPFS
  app.get('/api/storage/retrieve/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      
      // Try local cache first for faster retrieval
      const cached = storageMap.get(id);
      if (cached) {
        return reply.send({ 
          data: cached.data, 
          storedAt: cached.storedAt,
          version: cached.version,
          source: cached.fallback ? 'local' : 'ipfs-cache'
        });
      }

      // Retrieve from Crust Network
      const data = await crustNetwork.retrieveData(id);
      
      // Cache the result
      const result = {
        data,
        storedAt: Date.now(),
        version: '1.0'
      };
      storageMap.set(id, result);
      
      req.log.info(`🌐 Retrieved from Crust IPFS: ${id}`);
      return reply.send({ 
        data,
        storedAt: result.storedAt,
        version: result.version,
        source: 'ipfs'
      });
    } catch (error) {
      req.log.error('Error retrieving data:', error);
      return reply.code(404).send({ error: 'Content not found' });
    }
  });

  // Pin content (no-op for development, would pin on IPFS in production)
  app.post('/api/storage/pin/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const stored = storageMap.get(id);
      
      if (!stored) {
        return reply.code(404).send({ error: 'Content not found' });
      }

      // In production, this would pin the content on IPFS
      req.log.info(`Pinned content: ${id}`);
      return reply.send({ message: 'Content pinned successfully' });
    } catch (error) {
      req.log.error('Error pinning content:', error);
      return reply.code(500).send({ error: 'Failed to pin content' });
    }
  });

  // Create job with decentralized storage
  app.post('/api/jobs/decentralized', async (req, reply) => {
    try {
      const body = req.body || {};
      const jobId = crypto.randomUUID();
      
      // Store the job metadata along with the storage entry
      const jobMetadata = {
        id: jobId,
        title: body.title,
        description: body.description,
        companyId: body.companyId,
        location: body.location,
        salary: body.salary,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        tags: body.tags,
        skills: body.skills,
        employmentType: body.employmentType,
        experienceLevel: body.experienceLevel,
        remote: body.remote,
        applicationEmail: body.applicationEmail,
        applicationMethod: body.applicationMethod,
        benefits: body.benefits,
        createdAt: Date.now(),
        postedBy: 'decentralized-user',
        expiresAt: body.expiresAt
      };

      // Store the job data on real Crust Network IPFS
      const storeResponse = await fetch('http://localhost:4000/api/storage/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: jobMetadata })
      });
      
      if (!storeResponse.ok) {
        throw new Error('Failed to store job on IPFS');
      }
      
      const storeResult = await storeResponse.json();
      const storageId = storeResult.id;

      // Also store a job reference by job ID for easy lookup
      jobStorageMap.set(jobId, storageId);

      req.log.info(`Created decentralized job with ID: ${jobId} and storage ID: ${storageId}`);
      
      return reply.code(201).send({
        ...jobMetadata,
        storageId,
        success: true
      });
    } catch (error) {
      req.log.error('Error creating decentralized job:', error);
      return reply.code(400).send({ 
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all decentralized jobs
  app.get('/api/jobs/decentralized', async (req, reply) => {
    try {
      // For now, return jobs from storage map (in future, this would query IPFS/distributed storage)
      const jobs = Array.from(storageMap.values()).map((stored: any) => ({
        id: Math.random().toString(36).substring(7), // temp ID
        ...stored.data,
        createdAt: stored.storedAt,
        storageId: Array.from(storageMap.keys()).find(key => storageMap.get(key) === stored)
      }));
      
      return reply.send(jobs);
    } catch (error) {
      req.log.error('Error fetching decentralized jobs:', error);
      return reply.code(500).send({ error: 'Failed to fetch jobs' });
    }
  });

  // Get individual decentralized job by ID
  app.get('/api/jobs/decentralized/:id', async (req, reply) => {
    try {
      const jobId = (req.params as any).id;
      
      // Look up storage ID by job ID
      const storageId = jobStorageMap.get(jobId);
      if (!storageId) {
        return reply.code(404).send({ error: 'Job not found' });
      }

      // Get job data from storage
      const stored = storageMap.get(storageId);
      if (!stored) {
        return reply.code(404).send({ error: 'Job data not found' });
      }

      return reply.send({
        ...stored.data,
        storageId,
        retrievedAt: Date.now()
      });
    } catch (error) {
      req.log.error('Error fetching decentralized job:', error);
      return reply.code(500).send({ error: 'Failed to fetch job' });
    }
  });

  // =============================================================================
  // USER ENDPOINTS
  // =============================================================================

  // Get user by ID
  app.get('/api/users/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const user = await getUserById(id);
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      
      return reply.send(normalizeRow(user));
    } catch (error) {
      req.log.error('Error fetching user:', error);
      return reply.code(500).send({ error: 'Failed to fetch user' });
    }
  });

  // Create new user
  app.post('/api/users', async (req, reply) => {
    try {
      const body = req.body || {};
      const validatedData = UserCreateSchema.parse(body);
      
      const user = await createUser(validatedData);
      return reply.code(201).send(normalizeRow(user));
    } catch (error) {
      req.log.error('Error creating user:', error);
      return reply.code(400).send({ 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update user
  app.put('/api/users/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const body = req.body || {};
      const validatedData = UserUpdateSchema.parse(body);
      
      const user = await updateUser(id, validatedData);
      return reply.send(normalizeRow(user));
    } catch (error) {
      req.log.error('Error updating user:', error);
      return reply.code(400).send({ error: 'Failed to update user' });
    }
  });

  // Delete user
  app.delete('/api/users/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      await deleteUser(id);
      return reply.send({ message: 'User deleted successfully' });
    } catch (error) {
      req.log.error('Error deleting user:', error);
      return reply.code(500).send({ error: 'Failed to delete user' });
    }
  });

  // =============================================================================
  // USER SKILLS ENDPOINTS
  // =============================================================================

  app.get('/api/users/:id/skills', async (req, reply) => {
    try {
      const userId = (req.params as any).id;
      const skills = await getUserSkills(userId);
      return reply.send(skills.map(normalizeRow));
    } catch (error) {
      req.log.error('Error fetching user skills:', error);
      return reply.code(500).send({ error: 'Failed to fetch user skills' });
    }
  });

  app.post('/api/users/:id/skills', async (req, reply) => {
    try {
      const userId = (req.params as any).id;
      const body = req.body || {};
      const validatedData = UserSkillCreateSchema.parse(body);
      
      const skill = await addUserSkill(userId, validatedData);
      return reply.code(201).send(normalizeRow(skill));
    } catch (error) {
      req.log.error('Error adding user skill:', error);
      return reply.code(400).send({ error: 'Failed to add skill' });
    }
  });

  // =============================================================================
  // COMPANY ENDPOINTS
  // =============================================================================

  app.get('/api/companies/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const company = await getCompanyById(id);
      
      if (!company) {
        return reply.code(404).send({ error: 'Company not found' });
      }
      
      return reply.send(normalizeRow(company));
    } catch (error) {
      req.log.error('Error fetching company:', error);
      return reply.code(500).send({ error: 'Failed to fetch company' });
    }
  });

  app.post('/api/companies', async (req, reply) => {
    try {
      const body = req.body || {};
      const validatedData = CompanyCreateSchema.parse(body);
      
      const company = await createCompany(validatedData, (body as any).createdBy);
      return reply.code(201).send(normalizeRow(company));
    } catch (error) {
      req.log.error('Error creating company:', error);
      return reply.code(400).send({ 
        error: 'Failed to create company',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =============================================================================
  // APPLICATION ENDPOINTS
  // =============================================================================

  app.get('/api/jobs/:jobId/applications', async (req, reply) => {
    try {
      const jobId = (req.params as any).jobId;
      const applications = await getJobApplications(jobId);
      return reply.send(applications.map(normalizeRow));
    } catch (error) {
      req.log.error('Error fetching job applications:', error);
      return reply.code(500).send({ error: 'Failed to fetch applications' });
    }
  });

  app.post('/api/jobs/:jobId/applications', async (req, reply) => {
    try {
      const jobId = (req.params as any).jobId;
      const body = req.body || {};
      const validatedData = ApplicationCreateSchema.parse({ ...body, jobId });
      
      const application = await createApplication(validatedData, (body as any).applicantId);
      return reply.code(201).send(normalizeRow(application));
    } catch (error) {
      req.log.error('Error creating application:', error);
      return reply.code(400).send({ 
        error: 'Failed to create application',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =============================================================================
  // LEGACY LISTINGS ENDPOINTS (Backward Compatibility)
  // =============================================================================

  // Legacy listings endpoints that proxy to jobs
  app.get('/api/listings', async (req, reply) => {
    // Redirect to jobs endpoint with legacy parameter mapping
    const query = req.query as any;
    const mappedQuery = {
      q: query.q,
      category: query.category,
      location: query.region || query.location,
      employmentType: query.employmentType,
      salaryMin: query.minSalary || query.salaryMin,
      salaryMax: query.maxSalary || query.salaryMax,
      remote: query.remote,
      experienceLevel: query.level,
      page: query.page,
      limit: query.limit
    };

    // Remove undefined values
    Object.keys(mappedQuery).forEach(key => {
      if (mappedQuery[key] === undefined) {
        delete mappedQuery[key];
      }
    });

    try {
      const jobs = mappedQuery.q || mappedQuery.category || mappedQuery.location || mappedQuery.employmentType || mappedQuery.salaryMin || mappedQuery.salaryMax || mappedQuery.remote || mappedQuery.experienceLevel
        ? await searchJobs(mappedQuery as any)
        : await getAllJobs(parseInt(mappedQuery.page || '1'), parseInt(mappedQuery.limit || '20'));

      // Convert jobs back to legacy listing format
      const listings = jobs.map(job => ({
        ...job,
        seller: job.postedBy || job.seller,
        region: job.location || job.region,
        price: job.salary || job.price,
        level: job.experienceLevel || job.level
      }));

      return reply.send(listings.map(normalizeRow));
    } catch (error) {
      req.log.error('Error fetching listings:', error);
      return reply.code(500).send({ error: 'Failed to fetch listings' });
    }
  });

  app.get('/api/listings/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const job = await getJobById(id);
      
      if (!job) {
        return reply.code(404).send({ error: 'Listing not found' });
      }

      // Convert job to legacy listing format
      const listing = {
        ...job,
        seller: job.postedBy || job.seller,
        region: job.location || job.region,
        price: job.salary || job.price,
        level: job.experienceLevel || job.level
      };
      
      return reply.send(normalizeRow(listing));
    } catch (error) {
      req.log.error('Error fetching listing:', error);
      return reply.code(500).send({ error: 'Failed to fetch listing' });
    }
  });

  // Legacy listing creation that maps to job creation
  app.post('/api/listings', async (req, reply) => {
    try {
      const body = req.body || {};
      
      // Map legacy listing fields to job fields
      const jobData = {
        title: body.title,
        description: body.description,
        postedBy: body.seller,
        location: body.region,
        salary: body.price,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        employmentType: body.employmentType || 'full-time',
        experienceLevel: body.level || 'mid',
        remote: body.remote ? 'remote' : 'onsite',
        category: body.category,
        tags: body.tags ? [body.tags] : [],
        benefits: body.benefits,
        applicationEmail: body.contact,
        images: body.images || []
      };

      // Remove undefined values
      Object.keys(jobData).forEach(key => {
        if (jobData[key] === undefined) {
          delete jobData[key];
        }
      });

      const validatedData = JobCreateSchema.parse(jobData);
      const job = await createJob(validatedData, body.seller);

      // Convert back to legacy format for response
      const listing = {
        ...job,
        seller: job.postedBy,
        region: job.location,
        price: job.salary,
        level: job.experienceLevel,
        contact: job.applicationEmail
      };

      return reply.code(201).send(normalizeRow(listing));
    } catch (error) {
      req.log.error('Error creating listing:', error);
      return reply.code(400).send({ 
        error: 'Failed to create listing',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get detailed account info
  app.get('/api/crust/account/:address?', async (req, reply) => {
    try {
      const address = req.params.address || crustNetwork.getAccountAddress();
      
      // Make sure Crust Network is initialized
      if (!crustNetwork || address === 'Not initialized') {
        await initializeCrustNetwork();
      }
      
      const actualAddress = crustNetwork.getAccountAddress();
      const balance = await crustNetwork.getAccountBalance();
      
      // Convert balance from smallest unit to CRU (if needed)
      const balanceInCRU = balance === '0' ? '0' : (parseInt(balance) / 1000000000000).toString();
      
      const accountInfo = {
        address: actualAddress,
        balance: balance,
        balanceInCRU: balanceInCRU,
        network: 'Rocky Network (Testnet)',
        explorerUrl: `https://rocky.subscan.io/account/${actualAddress}`,
        funded: balance !== '0'
      };
      
      return reply.send(accountInfo);
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Failed to get account info',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Crust Network status endpoint
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
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Failed to get Crust Network status',
        connected: false
      });
    }
  });

  // Get storage order status for a CID
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
    } catch (error) {
      return reply.code(500).send({ 
        error: 'Failed to get storage order status'
      });
    }
  });

  // Start server
  const port = parseInt(process.env.PORT || '4000', 10);
  app.listen({ port, host: '0.0.0.0' }).then(async () => {
    app.log.info(`🚀 Server running on http://localhost:${port}`);
    app.log.info('📊 Database initialized and ready');
    
    // Initialize Crust Network connection
    try {
      app.log.info('🌐 Initializing Crust Network...');
      await initializeCrustNetwork();
      app.log.info(`🔗 Connected to Crust Network - Account: ${crustNetwork.getAccountAddress()}`);
      app.log.info(`💰 Account Balance: ${await crustNetwork.getAccountBalance()}`);
    } catch (error) {
      app.log.error('❌ Failed to initialize Crust Network:', error);
      app.log.warn('⚠️ Server will continue with fallback storage');
    }
  });
}

main().catch(console.error);
