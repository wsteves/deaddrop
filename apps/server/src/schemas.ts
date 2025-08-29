
import { z } from 'zod';

export const ListingCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().int().nonnegative().optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  category: z.string().optional().default('general'),
  region: z.string().min(2).optional(),
  seller: z.string().min(2),
  employmentType: z.string().optional(),
  level: z.string().optional(),
  remote: z.boolean().optional().default(false),
  tags: z.string().optional(),
  contact: z.string().optional(),
  benefits: z.string().optional(),
  images: z.array(z.string().url()).default([])
});

export const Listing = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  seller: z.string(),
  employmentType: z.string().optional(),
  level: z.string().optional(),
  remote: z.boolean().optional(),
  tags: z.string().optional(),
  contact: z.string().optional(),
  benefits: z.string().optional(),
  images: z.array(z.string()),
  createdAt: z.number(),
  commitHash: z.string().nullable().optional(),
  blockHash: z.string().nullable().optional(),
  blockNumber: z.number().nullable().optional()
});
