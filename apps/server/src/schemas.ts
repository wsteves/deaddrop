
import { z } from 'zod';

export const ListingCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().int().nonnegative(),
  category: z.string().optional().default('general'),
  region: z.string().min(2),
  seller: z.string().min(2),
  images: z.array(z.string().url()).default([])
});

export const Listing = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string().optional(),
  region: z.string(),
  seller: z.string(),
  images: z.array(z.string()),
  createdAt: z.number(),
  commitHash: z.string().nullable().optional()
});
