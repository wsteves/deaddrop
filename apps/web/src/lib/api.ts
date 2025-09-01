export async function fetchOnchainListings() {
  const res = await api.get<Listing[]>('/api/listings/onchain');
  return res.data;
}

import axios from 'axios';
import { defaultStorage } from './storage';

export const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE
});

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category?: string;
  region: string;
  seller: string;
  images: string[];
  createdAt: number;
  commitHash?: string | null;
  blockHash?: string | null;
}

export type Job = {
  id: string;
  title: string;
  description: string;
  companyId?: string;
  location?: string;
  salary?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  tags?: string[];  // Change to array
  skills?: string[]; // Add skills array
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  experienceLevel?: 'internship' | 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  remote?: 'remote' | 'onsite' | 'hybrid'; // Change to enum
  benefits?: string | null;
  applicationEmail?: string; // Change from contact
  applicationMethod?: 'email' | 'url' | 'platform';
  createdAt: number;
  // Storage-related fields (replacing blockchain fields)
  storageId?: string | null; // IPFS hash or storage ID
  isPinned?: boolean; // Whether content is pinned on IPFS
  expiresAt?: number | null; // Optional expiry timestamp
}

export type JobSummary = {
  id: string;
  title: string;
  companyId?: string;
  location?: string;
  salary?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  tags?: string[];
  employmentType?: string;
  experienceLevel?: string;
  remote?: string;
  createdAt: number;
  storageId?: string | null;
  expiresAt?: number | null;
}

export async function fetchListings(params?: { q?: string; region?: string; category?: string; cursor?: string; limit?: number }) {
  const res = await api.get<Listing[]>('/api/listings', { params });
  return res.data;
}

export async function fetchListing(id: string) {
  const res = await api.get<Listing>(`/api/listings/${id}`);
  return res.data;
}

export interface CreateListingResponse {
  id: string;
  createdAt: number;
  commitHash?: string | null;
}
export async function createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<CreateListingResponse> {
  const res = await api.post<CreateListingResponse>('/api/listings', data);
  return res.data;
}

export async function saveCommit(id: string, commitHash: string) {
  const res = await api.post('/api/listings/' + id + '/commit', { commitHash });
  return res.data;
}

export async function fetchOnchainListingById(id: string) {
  const res = await api.get('/api/listings/onchain', { params: { id } });
  return res.data;
}

// Jobs API helpers
export async function fetchJobs(params?: { q?: string; cursor?: string; limit?: number }) {
  try {
    // Fetch both regular jobs and decentralized jobs
    const [regularJobs, decentralizedJobs] = await Promise.allSettled([
      api.get<Job[]>('/api/jobs', { params }).then(res => res.data),
      api.get<Job[]>('/api/jobs/decentralized').then(res => res.data)
    ]);

    const jobs: Job[] = [];
    
    if (regularJobs.status === 'fulfilled') {
      jobs.push(...regularJobs.value);
    }
    
    if (decentralizedJobs.status === 'fulfilled') {
      jobs.push(...decentralizedJobs.value);
    }

    return jobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

export async function fetchJob(id: string) {
  const res = await api.get<Job>(`/api/jobs/${id}`);
  return res.data;
}

export async function createJob(data: Omit<Job, 'id' | 'createdAt'>) {
  const res = await api.post<CreateListingResponse>('/api/jobs', data);
  return res.data;
}

export async function saveJobCommit(id: string, commitHash: string, blockHash?: string | null, blockNumber?: number | null, author?: string) {
  const res = await api.post('/api/jobs/' + id + '/commit', { commitHash, blockHash, blockNumber, author });
  return res.data;
}

// Decentralized storage functions
export async function createJobWithStorage(data: Omit<Job, 'id' | 'createdAt' | 'storageId'>) {
  try {
    // Send job data to decentralized endpoint - server handles storage and ID generation
    const res = await api.post<any>('/api/jobs/decentralized', data);
    
    return res.data;
  } catch (error) {
    console.error('Failed to create job with storage:', error);
    throw error;
  }
}

export async function fetchJobWithStorage(id: string): Promise<Job> {
  try {
    // First check if this ID looks like a storage ID (starts with "ipfs_")
    if (id.startsWith('ipfs_')) {
      try {
        const fullData = await defaultStorage.retrieve(id);
        return fullData;
      } catch (error) {
        console.warn('Failed to fetch from storage directly:', error);
      }
    }

    // Try to fetch individual decentralized job by ID
    try {
      const response = await api.get<Job>(`/api/jobs/decentralized/${id}`);
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch from decentralized jobs endpoint:', error);
    }

    // Try to find the job in the decentralized jobs list (fallback)
    try {
      const decentralizedJobs = await api.get<Job[]>('/api/jobs/decentralized');
      const job = decentralizedJobs.data.find(j => j.id === id);
      
      if (job && job.storageId) {
        try {
          const fullData = await defaultStorage.retrieve(job.storageId);
          return { ...job, ...fullData }; // Merge job metadata with storage data
        } catch (error) {
          console.warn('Failed to fetch from storage, using job data:', error);
          return job; // Return the job data we have
        }
      }
    } catch (error) {
      console.warn('Failed to fetch from decentralized jobs:', error);
    }

    // Finally try getting job summary from the database (legacy jobs)
    try {
      const summary = await fetchJob(id);
      
      // If we have a storage ID, fetch full data from decentralized storage
      if (summary.storageId) {
        try {
          const fullData = await defaultStorage.retrieve(summary.storageId);
          return fullData;
        } catch (error) {
          console.warn('Failed to fetch from storage, using database data:', error);
          return summary;
        }
      }
      
      return summary;
    } catch (error) {
      console.error('Failed to fetch job from database:', error);
      throw new Error(`Job not found: ${id}`);
    }
  } catch (error) {
    console.error('Failed to fetch job:', error);
    throw error;
  }
}
