
import { z } from 'zod';

// User schemas
export const UserCreateSchema = z.object({
  walletAddress: z.string().optional(),
  email: z.string().email(),
  userType: z.enum(['employee', 'employer', 'both']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  profileImage: z.string().url().optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  timezone: z.string().optional(),
  website: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  telegramHandle: z.string().optional(),
  discordHandle: z.string().optional(),
  profileVisibility: z.enum(['public', 'private', 'connections']).default('public'),
  availabilityStatus: z.enum(['available', 'busy', 'not_looking']).default('available'),
  preferredSalaryMin: z.number().int().nonnegative().optional(),
  preferredSalaryMax: z.number().int().nonnegative().optional(),
  preferredWorkType: z.string().optional(),
  preferredLocation: z.string().optional(),
  yearsOfExperience: z.number().int().nonnegative().optional()
});

export const UserUpdateSchema = UserCreateSchema.partial();

export const User = z.object({
  id: z.string(),
  walletAddress: z.string().nullable().optional(),
  email: z.string().email(),
  userType: z.enum(['employee', 'employer', 'both']),
  firstName: z.string(),
  lastName: z.string(),
  profileImage: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  telegramHandle: z.string().nullable().optional(),
  discordHandle: z.string().nullable().optional(),
  isVerified: z.boolean().default(false),
  onchainReputation: z.number().default(0),
  totalJobsPosted: z.number().default(0),
  totalApplications: z.number().default(0),
  emailVerified: z.boolean().default(false),
  profileVisibility: z.enum(['public', 'private', 'connections']),
  availabilityStatus: z.enum(['available', 'busy', 'not_looking']),
  preferredSalaryMin: z.number().nullable().optional(),
  preferredSalaryMax: z.number().nullable().optional(),
  preferredWorkType: z.string().nullable().optional(),
  preferredLocation: z.string().nullable().optional(),
  yearsOfExperience: z.number().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// Company schemas
export const CompanyCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  headquarters: z.string().max(200).optional(),
  isRemoteFirst: z.boolean().default(false),
  benefits: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  culture: z.string().max(1000).optional(),
  linkedinUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  walletAddress: z.string().optional()
});

export const CompanyUpdateSchema = CompanyCreateSchema.partial();

export const Company = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  companySize: z.string().nullable().optional(),
  foundedYear: z.number().nullable().optional(),
  headquarters: z.string().nullable().optional(),
  isRemoteFirst: z.boolean(),
  benefits: z.array(z.string()),
  techStack: z.array(z.string()),
  culture: z.string().nullable().optional(),
  verificationStatus: z.enum(['unverified', 'pending', 'verified']),
  totalEmployees: z.number().default(0),
  activeJobs: z.number().default(0),
  avgResponseTime: z.number().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  walletAddress: z.string().nullable().optional(),
  createdBy: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// Job schemas
export const JobCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  companyId: z.string().optional(),
  
  // Compensation
  salary: z.number().int().nonnegative().optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  salaryCurrency: z.string().default('EUR'),
  equityMin: z.number().nonnegative().optional(),
  equityMax: z.number().nonnegative().optional(),
  
  // Job Details
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']),
  experienceLevel: z.enum(['internship', 'entry', 'mid', 'senior', 'lead', 'executive']),
  remote: z.enum(['remote', 'onsite', 'hybrid']),
  location: z.string().optional(),
  timezone: z.string().optional(),
  
  // Skills and Tags
  skills: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  
  // Application Details
  applicationMethod: z.enum(['email', 'url', 'platform']).default('email'),
  applicationEmail: z.string().email().optional(),
  applicationUrl: z.string().url().optional(),
  applicationInstructions: z.string().optional(),
  
  // Metadata
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  isSponsored: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isRemoteFriendly: z.boolean().default(false),
  category: z.string().optional(),
  department: z.string().optional(),
  
  // Timing
  expiresAt: z.number().optional()
});

export const JobUpdateSchema = JobCreateSchema.partial();

export const Job = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().nullable().optional(),
  description: z.string(),
  shortDescription: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  responsibilities: z.string().nullable().optional(),
  benefits: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  postedBy: z.string(),
  
  // Compensation
  salary: z.number().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.string(),
  equityMin: z.number().nullable().optional(),
  equityMax: z.number().nullable().optional(),
  
  // Job Details
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']),
  experienceLevel: z.enum(['internship', 'entry', 'mid', 'senior', 'lead', 'executive']),
  remote: z.enum(['remote', 'onsite', 'hybrid']),
  location: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  
  // Skills and Tags
  skills: z.array(z.string()),
  tags: z.array(z.string()),
  techStack: z.array(z.string()),
  
  // Application Details
  applicationMethod: z.enum(['email', 'url', 'platform']),
  applicationEmail: z.string().nullable().optional(),
  applicationUrl: z.string().nullable().optional(),
  applicationInstructions: z.string().nullable().optional(),
  
  // Metadata
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  isSponsored: z.boolean(),
  isFeatured: z.boolean(),
  isRemoteFriendly: z.boolean(),
  category: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  
  // Blockchain
  commitHash: z.string().nullable().optional(),
  blockHash: z.string().nullable().optional(),
  blockNumber: z.number().nullable().optional(),
  verificationStatus: z.enum(['draft', 'published', 'verified', 'archived']),
  
  // Analytics
  viewCount: z.number().default(0),
  applicationCount: z.number().default(0),
  saveCount: z.number().default(0),
  
  // Timing
  publishedAt: z.number().nullable().optional(),
  expiresAt: z.number().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// Skill schemas
export const UserSkillCreateSchema = z.object({
  skillName: z.string().min(1).max(100),
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().int().nonnegative().optional()
});

export const UserSkill = z.object({
  id: z.string(),
  userId: z.string(),
  skillName: z.string(),
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().nullable().optional(),
  isEndorsed: z.boolean().default(false),
  endorsementCount: z.number().default(0),
  createdAt: z.number()
});

// Work experience schemas
export const WorkExperienceCreateSchema = z.object({
  companyName: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  isRemote: z.boolean().default(false),
  startDate: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  isCurrent: z.boolean().default(false),
  technologies: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([])
});

export const WorkExperience = z.object({
  id: z.string(),
  userId: z.string(),
  companyName: z.string(),
  position: z.string(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  isRemote: z.boolean(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean(),
  technologies: z.array(z.string()),
  achievements: z.array(z.string()),
  createdAt: z.number()
});

// Education schemas
export const EducationCreateSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().max(100).optional(),
  fieldOfStudy: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  startYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  endYear: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional(),
  description: z.string().max(1000).optional()
});

export const Education = z.object({
  id: z.string(),
  userId: z.string(),
  institution: z.string(),
  degree: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  startYear: z.number().nullable().optional(),
  endYear: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: z.number()
});

// Application schemas
export const ApplicationCreateSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().max(2000).optional(),
  resumeUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  expectedSalary: z.number().int().nonnegative().optional(),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  customAnswers: z.record(z.string()).optional()
});

export const Application = z.object({
  id: z.string(),
  jobId: z.string(),
  applicantId: z.string(),
  companyId: z.string().nullable().optional(),
  coverLetter: z.string().nullable().optional(),
  resumeUrl: z.string().nullable().optional(),
  portfolioUrl: z.string().nullable().optional(),
  expectedSalary: z.number().nullable().optional(),
  availableFrom: z.string().nullable().optional(),
  customAnswers: z.record(z.string()).nullable().optional(),
  status: z.enum(['submitted', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn']),
  lastMessageAt: z.number().nullable().optional(),
  interviewScheduledAt: z.number().nullable().optional(),
  submittedAt: z.number(),
  viewedAt: z.number().nullable().optional(),
  respondedAt: z.number().nullable().optional()
});

// Legacy compatibility for existing code
export const ListingCreateSchema = JobCreateSchema.extend({
  seller: z.string().min(2),
  images: z.array(z.string().url()).default([]),
  price: z.number().int().nonnegative().optional(),
  category: z.string().optional().default('general'),
  region: z.string().min(2).optional(),
  level: z.string().optional(),
  contact: z.string().optional()
});

export const Listing = Job.extend({
  seller: z.string(),
  images: z.array(z.string()),
  price: z.number().nullable().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  level: z.string().optional(),
  contact: z.string().optional()
});

export type UserType = z.infer<typeof User>;
export type CompanyType = z.infer<typeof Company>;
export type JobType = z.infer<typeof Job>;
export type UserSkillType = z.infer<typeof UserSkill>;
export type WorkExperienceType = z.infer<typeof WorkExperience>;
export type EducationType = z.infer<typeof Education>;
export type ApplicationType = z.infer<typeof Application>;
