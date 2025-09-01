import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import { getDb, loadDatabase, getAllJobs, getJobById, createJob, searchJobs, getUserById, createUser, updateUser, deleteUser, getCompanyById, createCompany, updateCompany, deleteCompany, getUserSkills, addUserSkill, updateUserSkill, deleteUserSkill, getUserWorkExperience, addWorkExperience, updateWorkExperience, deleteWorkExperience, getUserEducation, addEducation, updateEducation, deleteEducation, getJobApplications, createApplication, updateApplication, getApplicationById, getUserApplications, saveJob, unsaveJob, getUserSavedJobs } from './db.js';
import { JobCreateSchema, JobUpdateSchema, UserCreateSchema, UserUpdateSchema, CompanyCreateSchema, CompanyUpdateSchema, UserSkillCreateSchema, WorkExperienceCreateSchema, EducationCreateSchema, ApplicationCreateSchema, ListingCreateSchema } from './schemas.js';
import crypto from 'crypto';

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
  
  const app = Fastify({ logger: true });
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

  // Store data (simulating IPFS)
  app.post('/api/storage/store', async (req, reply) => {
    try {
      const { data } = req.body as any;
      if (!data) {
        return reply.code(400).send({ error: 'No data provided' });
      }

      // Generate a content-addressed ID (in real IPFS this would be based on content hash)
      const id = 'ipfs_' + crypto.randomBytes(16).toString('hex');
      
      // Store the data
      storageMap.set(id, {
        data,
        storedAt: Date.now(),
        version: '1.0'
      });

      req.log.info(`Stored data with ID: ${id}`);
      return reply.send({ id, message: 'Data stored successfully' });
    } catch (error) {
      req.log.error('Error storing data:', error);
      return reply.code(500).send({ error: 'Failed to store data' });
    }
  });

  // Retrieve data
  app.get('/api/storage/retrieve/:id', async (req, reply) => {
    try {
      const id = (req.params as any).id;
      const stored = storageMap.get(id);
      
      if (!stored) {
        return reply.code(404).send({ error: 'Content not found' });
      }

      return reply.send({ 
        data: stored.data, 
        storedAt: stored.storedAt,
        version: stored.version 
      });
    } catch (error) {
      req.log.error('Error retrieving data:', error);
      return reply.code(500).send({ error: 'Failed to retrieve data' });
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

      // Create a storage entry that includes the job metadata  
      const storageId = 'ipfs_' + crypto.randomBytes(16).toString('hex');
      storageMap.set(storageId, {
        data: jobMetadata,
        storedAt: Date.now(),
        version: '1.0'
      });

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

  // Start server
  const port = parseInt(process.env.PORT || '4000', 10);
  app.listen({ port, host: '0.0.0.0' }).then(() => {
    app.log.info(`🚀 Server running on http://localhost:${port}`);
    app.log.info('📊 Database initialized and ready');
  });
}

main().catch(console.error);
