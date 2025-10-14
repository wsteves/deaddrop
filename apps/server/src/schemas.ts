
import { z } from 'zod';

// Minimal User schema for dripdrop
export const User = z.object({
  id: z.string(),
  walletAddress: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// Storage metadata schema
export const StorageMetadata = z.object({
  id: z.string(),
  cid: z.string(),
  filename: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  size: z.number().nullable().optional(),
  uploadedBy: z.string(),
  createdAt: z.number()
});

// Message schema
export const MessageCreate = z.object({
  senderId: z.string(),
  recipientId: z.string(),
  storageId: z.string().optional(),
  ciphertext: z.any().optional(),
  sealedKey: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  snippet: z.string().nullable().optional(),
  meta: z.any().optional()
});

export const Message = z.object({
  id: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  storageId: z.string(),
  sealedKey: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  snippet: z.string().nullable().optional(),
  isRead: z.boolean().default(false),
  deliveredAt: z.number().nullable().optional(),
  createdAt: z.number()
});

// Type exports
export type UserType = z.infer<typeof User>;
export type StorageMetadataType = z.infer<typeof StorageMetadata>;
export type MessageType = z.infer<typeof Message>;
export type MessageCreateType = z.infer<typeof MessageCreate>;
