export async function fetchOnchainListings() {
  const res = await api.get<Listing[]>('/api/listings/onchain');
  return res.data;
}

import axios from 'axios';

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
  commitHash?: string | null;
  blockNumber?: number | null;
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
  const res = await api.get<Job[]>('/api/jobs', { params });
  return res.data;
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
