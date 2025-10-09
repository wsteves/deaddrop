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
  
  // Create comprehensive database schema
  await createTables();
}

async function createTables() {
  try {
    // Drop any existing tables to start fresh
    const dropTables = [
      'notifications',
      'user_connections', 
      'company_followers',
      'saved_jobs',
      'applications',
      'education',
      'work_experience',
      'user_skills',
      'jobs',
      'companies',
      'users',
      'listings' // Remove old table if it exists
    ];
    
    for (const table of dropTables) {
      try {
        db.run(`DROP TABLE IF EXISTS ${table}`);
      } catch (error) {
        // Ignore errors if table doesn't exist
      }
    }

    // Users table - for both employees and employers
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      walletAddress TEXT UNIQUE,
      email TEXT UNIQUE,
      userType TEXT NOT NULL CHECK (userType IN ('employee', 'employer', 'both')),
      firstName TEXT,
      lastName TEXT,
      profileImage TEXT,
      bio TEXT,
      location TEXT,
      timezone TEXT,
      website TEXT,
      linkedinUrl TEXT,
      githubUrl TEXT,
      twitterUrl TEXT,
      telegramHandle TEXT,
      discordHandle TEXT,
      isVerified INTEGER DEFAULT 0,
      onchainReputation INTEGER DEFAULT 0,
      totalJobsPosted INTEGER DEFAULT 0,
      totalApplications INTEGER DEFAULT 0,
      emailVerified INTEGER DEFAULT 0,
      profileVisibility TEXT DEFAULT 'public' CHECK (profileVisibility IN ('public', 'private', 'connections')),
      availabilityStatus TEXT DEFAULT 'available' CHECK (availabilityStatus IN ('available', 'busy', 'not_looking')),
      preferredSalaryMin INTEGER,
      preferredSalaryMax INTEGER,
      preferredWorkType TEXT,
      preferredLocation TEXT,
      yearsOfExperience INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  // Companies table
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      website TEXT,
      logo TEXT,
      coverImage TEXT,
      industry TEXT,
      companySize TEXT CHECK (companySize IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
      foundedYear INTEGER,
      headquarters TEXT,
      isRemoteFirst INTEGER DEFAULT 0,
      benefits TEXT, -- JSON array of benefits
      techStack TEXT, -- JSON array of technologies
      culture TEXT,
      verificationStatus TEXT DEFAULT 'unverified' CHECK (verificationStatus IN ('unverified', 'pending', 'verified')),
      totalEmployees INTEGER DEFAULT 0,
      activeJobs INTEGER DEFAULT 0,
      avgResponseTime INTEGER, -- in hours
      linkedinUrl TEXT,
      twitterUrl TEXT,
      githubUrl TEXT,
      walletAddress TEXT,
      createdBy TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );
  `);

  // Jobs table - comprehensive job postings
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT,
      description TEXT NOT NULL,
      shortDescription TEXT,
      requirements TEXT,
      responsibilities TEXT,
      benefits TEXT,
      companyId TEXT,
      postedBy TEXT NOT NULL,
      
      -- Compensation
      salary INTEGER,
      salaryMin INTEGER,
      salaryMax INTEGER,
      salaryCurrency TEXT DEFAULT 'EUR',
      equityMin REAL,
      equityMax REAL,
      
      -- Job Details
      employmentType TEXT NOT NULL CHECK (employmentType IN ('full-time', 'part-time', 'contract', 'freelance', 'internship')),
      experienceLevel TEXT NOT NULL CHECK (experienceLevel IN ('internship', 'entry', 'mid', 'senior', 'lead', 'executive')),
      remote TEXT NOT NULL CHECK (remote IN ('remote', 'onsite', 'hybrid')),
      location TEXT,
      timezone TEXT,
      
      -- Skills and Tags
      skills TEXT, -- JSON array
      tags TEXT, -- JSON array
      techStack TEXT, -- JSON array
      
      -- Application Details
      applicationMethod TEXT CHECK (applicationMethod IN ('email', 'url', 'platform')),
      applicationEmail TEXT,
      applicationUrl TEXT,
      applicationInstructions TEXT,
      
      -- Metadata
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      isSponsored INTEGER DEFAULT 0,
      isFeatured INTEGER DEFAULT 0,
      isRemoteFriendly INTEGER DEFAULT 0,
      category TEXT,
      department TEXT,
      
      -- Blockchain
      commitHash TEXT,
      blockHash TEXT,
      blockNumber INTEGER,
      verificationStatus TEXT DEFAULT 'draft' CHECK (verificationStatus IN ('draft', 'published', 'verified', 'archived')),
      
      -- Analytics
      viewCount INTEGER DEFAULT 0,
      applicationCount INTEGER DEFAULT 0,
      saveCount INTEGER DEFAULT 0,
      
      -- Timing
      publishedAt INTEGER,
      expiresAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      
      FOREIGN KEY (companyId) REFERENCES companies(id),
      FOREIGN KEY (postedBy) REFERENCES users(id)
    );
  `);

  // User skills table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_skills (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      skillName TEXT NOT NULL,
      proficiencyLevel TEXT CHECK (proficiencyLevel IN ('beginner', 'intermediate', 'advanced', 'expert')),
      yearsOfExperience INTEGER,
      isEndorsed INTEGER DEFAULT 0,
      endorsementCount INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, skillName)
    );
  `);

  // Work experience table
  db.run(`
    CREATE TABLE IF NOT EXISTS work_experience (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      companyName TEXT NOT NULL,
      position TEXT NOT NULL,
      description TEXT,
      location TEXT,
      isRemote INTEGER DEFAULT 0,
      startDate TEXT, -- YYYY-MM format
      endDate TEXT, -- YYYY-MM format or null for current
      isCurrent INTEGER DEFAULT 0,
      technologies TEXT, -- JSON array
      achievements TEXT, -- JSON array
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Education table
  db.run(`
    CREATE TABLE IF NOT EXISTS education (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      institution TEXT NOT NULL,
      degree TEXT,
      fieldOfStudy TEXT,
      grade TEXT,
      startYear INTEGER,
      endYear INTEGER,
      description TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL,
      applicantId TEXT NOT NULL,
      companyId TEXT,
      
      -- Application data
      coverLetter TEXT,
      resumeUrl TEXT,
      portfolioUrl TEXT,
      expectedSalary INTEGER,
      availableFrom TEXT, -- YYYY-MM-DD
      customAnswers TEXT, -- JSON for custom questions
      
      -- Status tracking
      status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn')),
      
      -- Communication
      lastMessageAt INTEGER,
      interviewScheduledAt INTEGER,
      
      -- Analytics
      submittedAt INTEGER NOT NULL,
      viewedAt INTEGER,
      respondedAt INTEGER,
      
      FOREIGN KEY (jobId) REFERENCES jobs(id),
      FOREIGN KEY (applicantId) REFERENCES users(id),
      FOREIGN KEY (companyId) REFERENCES companies(id),
      UNIQUE(jobId, applicantId)
    );
  `);

  // Saved jobs table
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      jobId TEXT NOT NULL,
      savedAt INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (jobId) REFERENCES jobs(id),
      UNIQUE(userId, jobId)
    );
  `);

  // Company followers table
  db.run(`
    CREATE TABLE IF NOT EXISTS company_followers (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      companyId TEXT NOT NULL,
      followedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (companyId) REFERENCES companies(id),
      UNIQUE(userId, companyId)
    );
  `);

  // User connections/network table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_connections (
      id TEXT PRIMARY KEY,
      requesterId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
      message TEXT,
      requestedAt INTEGER NOT NULL,
      respondedAt INTEGER,
      FOREIGN KEY (requesterId) REFERENCES users(id),
      FOREIGN KEY (receiverId) REFERENCES users(id),
      UNIQUE(requesterId, receiverId)
    );
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('job_match', 'application_update', 'connection_request', 'message', 'company_update')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT, -- JSON for additional data
      isRead INTEGER DEFAULT 0,
      actionUrl TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Create indexes for performance
  db.run('CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(companyId);');
  db.run('CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(postedBy);');
  db.run('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(verificationStatus);');
  db.run('CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(createdAt);');
  db.run('CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(jobId);');
  db.run('CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(applicantId);');
  db.run('CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(userId);');
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);');
  db.run('CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(userId);');
  // Messages table for encrypted off-chain messages with IPFS pointers
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      recipientId TEXT NOT NULL,
      storageId TEXT NOT NULL,
      sealedKey TEXT, -- sealed symmetric key for recipient
      subject TEXT,
      snippet TEXT,
      isRead INTEGER DEFAULT 0,
      deliveredAt INTEGER,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (senderId) REFERENCES users(id),
      FOREIGN KEY (recipientId) REFERENCES users(id)
    );
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipientId);');
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);');

  console.log('Database initialized');
  } catch (error) {
    console.error('Error creating tables:', (error as Error).message);
    throw error;
  }
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

// Job functions
export function getAllJobs(page: number = 1, limit: number = 20) {
  const database = getDb();
  const offset = (page - 1) * limit;
  
  try {
    const stmt = database.prepare(`
      SELECT * FROM jobs 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `);
    
    const results = [];
    stmt.bind([limit, offset]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  } catch (error) {
    console.error('getAllJobs error:', error);
    return [];
  }
}

export function getJobById(id: string) {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT j.*, c.name as companyName, c.logo as companyLogo, c.website as companyWebsite
    FROM jobs j 
    LEFT JOIN companies c ON j.companyId = c.id 
    WHERE j.id = ?
  `);
  return stmt.get(id);
}

export function createJob(data: any, postedBy: string) {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  
  console.log('=== DEBUG createJob ===');
  console.log('Database object:', database);
  console.log('Generated ID:', id);
  console.log('Title:', data.title);
  console.log('Description:', data.description);
  console.log('PostedBy:', postedBy);
  
  // First, let's try to see what's in the jobs table
  try {
    const countStmt = database.prepare("SELECT COUNT(*) as count FROM jobs");
    const countResult = countStmt.get();
    console.log('Current jobs count:', countResult);
  } catch (e) {
    console.log('Could not count jobs:', e);
  }
  
  // Let's try a direct exec first
  try {
    console.log('Trying direct exec...');
    const directQuery = `INSERT INTO jobs (id, title, description, postedBy, employmentType, experienceLevel, remote, createdAt, updatedAt) VALUES ('${id}', '${data.title}', '${data.description}', '${postedBy}', '${data.employmentType}', '${data.experienceLevel}', '${data.remote}', ${now}, ${now})`;
    console.log('Direct query:', directQuery);
    database.exec(directQuery);
    console.log('Direct exec successful!');
    
    // Return a simple success object instead of calling getJobById
    return { 
      id, 
      title: data.title, 
      description: data.description,
      postedBy,
      employmentType: data.employmentType,
      experienceLevel: data.experienceLevel,
      remote: data.remote,
      createdAt: now,
      updatedAt: now,
      success: true 
    };
  } catch (error) {
    console.error('Direct exec failed:', error);
    
    // Now try with prepared statement
    try {
      console.log('Trying prepared statement...');
      const stmt = database.prepare(`
        INSERT INTO jobs (
          id, 
          title, 
          description, 
          postedBy, 
          employmentType, 
          experienceLevel, 
          remote, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        id,
        data.title,
        data.description, 
        postedBy,
        data.employmentType,
        data.experienceLevel,
        data.remote,
        now,
        now
      );
      
      console.log('Prepared statement successful:', result);
      return getJobById(id);
    } catch (error2) {
      console.error('Prepared statement failed:', error2);
      throw error2;
    }
  }
}

export function searchJobs(filters: any) {
  let query = `
    SELECT j.*, c.name as companyName, c.logo as companyLogo 
    FROM jobs j 
    LEFT JOIN companies c ON j.companyId = c.id 
    WHERE j.verificationStatus != 'archived'
  `;
  const params: any[] = [];

  if (filters.query) {
    query += ` AND (j.title LIKE ? OR j.description LIKE ? OR j.shortDescription LIKE ?)`;
    const searchTerm = `%${filters.query}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters.category) {
    query += ` AND j.category = ?`;
    params.push(filters.category);
  }

  if (filters.location) {
    query += ` AND j.location LIKE ?`;
    params.push(`%${filters.location}%`);
  }

  if (filters.remote !== undefined) {
    if (filters.remote) {
      query += ` AND j.remote IN ('remote', 'hybrid')`;
    } else {
      query += ` AND j.remote = 'onsite'`;
    }
  }

  if (filters.employmentType) {
    query += ` AND j.employmentType = ?`;
    params.push(filters.employmentType);
  }

  if (filters.experienceLevel) {
    query += ` AND j.experienceLevel = ?`;
    params.push(filters.experienceLevel);
  }

  if (filters.salaryMin) {
    query += ` AND (j.salaryMax >= ? OR j.salary >= ?)`;
    params.push(filters.salaryMin, filters.salaryMin);
  }

  if (filters.salaryMax) {
    query += ` AND (j.salaryMin <= ? OR j.salary <= ?)`;
    params.push(filters.salaryMax, filters.salaryMax);
  }

  if (filters.companyId) {
    query += ` AND j.companyId = ?`;
    params.push(filters.companyId);
  }

  if (filters.skills && filters.skills.length > 0) {
    const skillConditions = filters.skills.map(() => `j.skills LIKE ?`).join(' OR ');
    query += ` AND (${skillConditions})`;
    filters.skills.forEach((skill: string) => params.push(`%"${skill}"%`));
  }

  query += ` ORDER BY j.createdAt DESC`;

  if (filters.limit) {
    const offset = ((filters.page || 1) - 1) * filters.limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, offset);
  }

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

// User functions
export function getUserById(id: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

export function createUser(data: any) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO users (
      id, walletAddress, email, userType, firstName, lastName, profileImage, bio, location, timezone,
      website, linkedinUrl, githubUrl, twitterUrl, telegramHandle, discordHandle, profileVisibility,
      availabilityStatus, preferredSalaryMin, preferredSalaryMax, preferredWorkType, preferredLocation,
      yearsOfExperience, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, data.walletAddress, data.email, data.userType, data.firstName, data.lastName, data.profileImage,
    data.bio, data.location, data.timezone, data.website, data.linkedinUrl, data.githubUrl, data.twitterUrl,
    data.telegramHandle, data.discordHandle, data.profileVisibility || 'public', data.availabilityStatus || 'available',
    data.preferredSalaryMin, data.preferredSalaryMax, data.preferredWorkType, data.preferredLocation,
    data.yearsOfExperience, now, now
  );

  return getUserById(id);
}

export function updateUser(id: string, data: any) {
  const fields = Object.keys(data).filter(key => data[key] !== undefined);
  if (fields.length === 0) return getUserById(id);

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => data[field]);
  values.push(Date.now(), id); // updatedAt, id

  const stmt = db.prepare(`UPDATE users SET ${setClause}, updatedAt = ? WHERE id = ?`);
  stmt.run(...values);

  return getUserById(id);
}

export function deleteUser(id: string) {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  return stmt.run(id);
}

// Company functions
export function getCompanyById(id: string) {
  const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
  return stmt.get(id);
}

export function createCompany(data: any, createdBy: string) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const stmt = db.prepare(`
    INSERT INTO companies (
      id, name, slug, description, website, logo, coverImage, industry, companySize, foundedYear,
      headquarters, isRemoteFirst, benefits, techStack, culture, linkedinUrl, twitterUrl, githubUrl,
      walletAddress, createdBy, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, data.name, slug, data.description, data.website, data.logo, data.coverImage, data.industry,
    data.companySize, data.foundedYear, data.headquarters, data.isRemoteFirst ? 1 : 0,
    JSON.stringify(data.benefits || []), JSON.stringify(data.techStack || []), data.culture,
    data.linkedinUrl, data.twitterUrl, data.githubUrl, data.walletAddress, createdBy, now, now
  );

  return getCompanyById(id);
}

export function updateCompany(id: string, data: any) {
  const fields = Object.keys(data).filter(key => data[key] !== undefined);
  if (fields.length === 0) return getCompanyById(id);

  // Handle array fields
  const processedData = { ...data };
  ['benefits', 'techStack'].forEach(field => {
    if (processedData[field] && Array.isArray(processedData[field])) {
      processedData[field] = JSON.stringify(processedData[field]);
    }
  });

  const setClause = Object.keys(processedData).map(field => `${field} = ?`).join(', ');
  const values = Object.values(processedData);
  values.push(Date.now(), id); // updatedAt, id

  const stmt = db.prepare(`UPDATE companies SET ${setClause}, updatedAt = ? WHERE id = ?`);
  stmt.run(...values);

  return getCompanyById(id);
}

export function deleteCompany(id: string) {
  const stmt = db.prepare('DELETE FROM companies WHERE id = ?');
  return stmt.run(id);
}

// User Skills functions
export function getUserSkills(userId: string) {
  const stmt = db.prepare('SELECT * FROM user_skills WHERE userId = ? ORDER BY createdAt DESC');
  return stmt.all(userId);
}

export function addUserSkill(userId: string, data: any) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO user_skills (id, userId, skillName, proficiencyLevel, yearsOfExperience, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, data.skillName, data.proficiencyLevel, data.yearsOfExperience, now);

  const getStmt = db.prepare('SELECT * FROM user_skills WHERE id = ?');
  return getStmt.get(id);
}

export function updateUserSkill(skillId: string, data: any) {
  const fields = Object.keys(data).filter(key => data[key] !== undefined);
  if (fields.length === 0) {
    const stmt = db.prepare('SELECT * FROM user_skills WHERE id = ?');
    return stmt.get(skillId);
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => data[field]);
  values.push(skillId);

  const stmt = db.prepare(`UPDATE user_skills SET ${setClause} WHERE id = ?`);
  stmt.run(...values);

  const getStmt = db.prepare('SELECT * FROM user_skills WHERE id = ?');
  return getStmt.get(skillId);
}

export function deleteUserSkill(skillId: string) {
  const stmt = db.prepare('DELETE FROM user_skills WHERE id = ?');
  return stmt.run(skillId);
}

// Work Experience functions
export function getUserWorkExperience(userId: string) {
  const stmt = db.prepare('SELECT * FROM work_experience WHERE userId = ? ORDER BY isCurrent DESC, endDate DESC, startDate DESC');
  return stmt.all(userId);
}

export function addWorkExperience(userId: string, data: any) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO work_experience (
      id, userId, companyName, position, description, location, isRemote, startDate, endDate,
      isCurrent, technologies, achievements, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, userId, data.companyName, data.position, data.description, data.location, data.isRemote ? 1 : 0,
    data.startDate, data.endDate, data.isCurrent ? 1 : 0, JSON.stringify(data.technologies || []),
    JSON.stringify(data.achievements || []), now
  );

  const getStmt = db.prepare('SELECT * FROM work_experience WHERE id = ?');
  return getStmt.get(id);
}

export function updateWorkExperience(experienceId: string, data: any) {
  const fields = Object.keys(data).filter(key => data[key] !== undefined);
  if (fields.length === 0) {
    const stmt = db.prepare('SELECT * FROM work_experience WHERE id = ?');
    return stmt.get(experienceId);
  }

  // Handle array fields
  const processedData = { ...data };
  ['technologies', 'achievements'].forEach(field => {
    if (processedData[field] && Array.isArray(processedData[field])) {
      processedData[field] = JSON.stringify(processedData[field]);
    }
  });

  const setClause = Object.keys(processedData).map(field => `${field} = ?`).join(', ');
  const values = Object.values(processedData);
  values.push(experienceId);

  const stmt = db.prepare(`UPDATE work_experience SET ${setClause} WHERE id = ?`);
  stmt.run(...values);

  const getStmt = db.prepare('SELECT * FROM work_experience WHERE id = ?');
  return getStmt.get(experienceId);
}

export function deleteWorkExperience(experienceId: string) {
  const stmt = db.prepare('DELETE FROM work_experience WHERE id = ?');
  return stmt.run(experienceId);
}

// Messaging helpers
export function createMessage(data: any) {
  const id = crypto.randomUUID();
  const now = Date.now();
  // Use direct SQL exec to avoid prepared-statement binding issues in this environment
  const safe = (s: any) => s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
  const sql = `INSERT INTO messages (id, senderId, recipientId, storageId, sealedKey, subject, snippet, isRead, deliveredAt, createdAt) VALUES (${safe(id)}, ${safe(data.senderId)}, ${safe(data.recipientId)}, ${safe(data.storageId)}, ${safe(data.sealedKey || null)}, ${safe(data.subject || null)}, ${safe(data.snippet || null)}, 0, ${safe(data.deliveredAt || null)}, ${now})`;
  db.exec(sql);
  const getStmt = db.prepare('SELECT * FROM messages WHERE id = ?');
  return getStmt.get(id);
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

// Education functions
export function getUserEducation(userId: string) {
  const stmt = db.prepare('SELECT * FROM education WHERE userId = ? ORDER BY endYear DESC, startYear DESC');
  return stmt.all(userId);
}

export function addEducation(userId: string, data: any) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO education (
      id, userId, institution, degree, fieldOfStudy, grade, startYear, endYear, description, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, userId, data.institution, data.degree, data.fieldOfStudy, data.grade,
    data.startYear, data.endYear, data.description, now
  );

  const getStmt = db.prepare('SELECT * FROM education WHERE id = ?');
  return getStmt.get(id);
}

export function updateEducation(educationId: string, data: any) {
  const fields = Object.keys(data).filter(key => data[key] !== undefined);
  if (fields.length === 0) {
    const stmt = db.prepare('SELECT * FROM education WHERE id = ?');
    return stmt.get(educationId);
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => data[field]);
  values.push(educationId);

  const stmt = db.prepare(`UPDATE education SET ${setClause} WHERE id = ?`);
  stmt.run(...values);

  const getStmt = db.prepare('SELECT * FROM education WHERE id = ?');
  return getStmt.get(educationId);
}

export function deleteEducation(educationId: string) {
  const stmt = db.prepare('DELETE FROM education WHERE id = ?');
  return stmt.run(educationId);
}

// Application functions
export function getJobApplications(jobId: string) {
  const stmt = db.prepare(`
    SELECT a.*, u.firstName, u.lastName, u.email, u.profileImage 
    FROM applications a 
    JOIN users u ON a.applicantId = u.id 
    WHERE a.jobId = ? 
    ORDER BY a.submittedAt DESC
  `);
  return stmt.all(jobId);
}

export function createApplication(data: any, applicantId: string) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  // Get job details to find companyId
  const jobStmt = db.prepare('SELECT companyId FROM jobs WHERE id = ?');
  const job = jobStmt.get(data.jobId);
  
  const stmt = db.prepare(`
    INSERT INTO applications (
      id, jobId, applicantId, companyId, coverLetter, resumeUrl, portfolioUrl, expectedSalary,
      availableFrom, customAnswers, status, submittedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, data.jobId, applicantId, job?.companyId, data.coverLetter, data.resumeUrl, data.portfolioUrl,
    data.expectedSalary, data.availableFrom, JSON.stringify(data.customAnswers || {}), 'submitted', now
  );

  return getApplicationById(id);
}

export function getApplicationById(id: string) {
  const stmt = db.prepare(`
    SELECT a.*, u.firstName, u.lastName, u.email, u.profileImage, j.title as jobTitle, j.companyId
    FROM applications a 
    JOIN users u ON a.applicantId = u.id 
    JOIN jobs j ON a.jobId = j.id 
    WHERE a.id = ?
  `);
  return stmt.get(id);
}

export function updateApplication(id: string, data: any) {
  const fields = Object.keys(data).filter(key => data[key] !== undefined);
  if (fields.length === 0) return getApplicationById(id);

  // Handle special fields
  const processedData = { ...data };
  if (processedData.customAnswers && typeof processedData.customAnswers === 'object') {
    processedData.customAnswers = JSON.stringify(processedData.customAnswers);
  }

  const setClause = Object.keys(processedData).map(field => `${field} = ?`).join(', ');
  const values = Object.values(processedData);
  values.push(id);

  const stmt = db.prepare(`UPDATE applications SET ${setClause} WHERE id = ?`);
  stmt.run(...values);

  return getApplicationById(id);
}

export function getUserApplications(userId: string) {
  const stmt = db.prepare(`
    SELECT a.*, j.title as jobTitle, j.location, j.employmentType, c.name as companyName, c.logo as companyLogo
    FROM applications a 
    JOIN jobs j ON a.jobId = j.id 
    LEFT JOIN companies c ON j.companyId = c.id 
    WHERE a.applicantId = ? 
    ORDER BY a.submittedAt DESC
  `);
  return stmt.all(userId);
}

// Saved Jobs functions
export function saveJob(userId: string, jobId: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO saved_jobs (id, userId, jobId, savedAt) 
    VALUES (?, ?, ?, ?)
  `);
  const id = crypto.randomUUID();
  stmt.run(id, userId, jobId, Date.now());
}

export function unsaveJob(userId: string, jobId: string) {
  const stmt = db.prepare('DELETE FROM saved_jobs WHERE userId = ? AND jobId = ?');
  return stmt.run(userId, jobId);
}

export function getUserSavedJobs(userId: string) {
  const stmt = db.prepare(`
    SELECT j.*, c.name as companyName, c.logo as companyLogo, sj.savedAt
    FROM saved_jobs sj
    JOIN jobs j ON sj.jobId = j.id
    LEFT JOIN companies c ON j.companyId = c.id
    WHERE sj.userId = ?
    ORDER BY sj.savedAt DESC
  `);
  return stmt.all(userId);
}
