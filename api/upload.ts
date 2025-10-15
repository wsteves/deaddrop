import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import { create } from 'kubo-rpc-client';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  maxDuration: 60, // 60 seconds for IPFS uploads
};

interface UploadRequest {
  filename: string;
  data: number[] | { data: number[]; filename: string; type: string; [key: string]: any };
  type: string;
  signature?: string;
  uploadedBy?: string;
  signedMessage?: string;
  encrypted?: boolean;
  storageType?: 'local' | 'ipfs'; // Optional, defaults to IPFS
}

// Initialize IPFS client using public gateway
function createIPFSClient() {
  // Use Infura public IPFS gateway (no auth required for uploads)
  return create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    timeout: 60000, // 60 second timeout
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as UploadRequest;
    
    // Handle both direct upload and wrapped data
    let filename: string;
    let data: number[];
    let type: string;
    let signature: string | undefined;
    let uploadedBy: string | undefined;
    let signedMessage: string | undefined;
    let encrypted: boolean | undefined;
    
    // Check if data is wrapped (from defaultStorage.store)
    if (typeof body.data === 'object' && !Array.isArray(body.data) && 'data' in body.data) {
      const wrapped = body.data;
      filename = wrapped.filename;
      data = wrapped.data;
      type = wrapped.type;
      signature = wrapped.signature || body.signature;
      uploadedBy = wrapped.uploadedBy || body.uploadedBy;
      signedMessage = wrapped.signedMessage || body.signedMessage;
      encrypted = wrapped.encrypted || body.encrypted;
    } else if (Array.isArray(body.data)) {
      filename = body.filename;
      data = body.data;
      type = body.type;
      signature = body.signature;
      uploadedBy = body.uploadedBy;
      signedMessage = body.signedMessage;
      encrypted = body.encrypted;
    } else {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    // Default to IPFS storage (not local!)
    const storageType = body.storageType || 'ipfs';

    if (!filename || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    let cid: string;
    let storageUrl: string | null = null;

    // Convert array of numbers to Buffer
    const buffer = Buffer.from(data);

    if (storageType === 'ipfs') {
      // Upload to IPFS via Crust Network gateway (same as original server)
      try {
        console.log('📡 Uploading to IPFS via Crust Network...');
        
        const ipfsClient = createIPFSClient();
        
        // Create the content package (same format as original)
        const content = JSON.stringify({
          data: {
            filename,
            type,
            size: buffer.length,
            data: Array.from(buffer),
            encrypted: encrypted || false,
          },
          signature,
          uploadedBy,
          signedMessage,
          timestamp: Date.now(),
          version: '1.0',
        });

        // Upload to IPFS
        const uploadResult = await ipfsClient.add(content);
        cid = uploadResult.path; // This is the IPFS CID (starts with Qm...)
        storageUrl = `https://ipfs.io/ipfs/${cid}`;
        
        console.log(`✅ Uploaded to IPFS: ${cid}`);
        console.log(`🌐 Accessible at: https://ipfs.io/ipfs/${cid}`);
        
      } catch (ipfsError) {
        console.error('IPFS upload error, falling back to blob storage:', ipfsError);
        
        // Fallback to blob storage
        const blobResult = await put(filename, buffer, {
          access: 'public',
          contentType: type || 'application/octet-stream',
        });
        cid = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        storageUrl = blobResult.url;
        
        console.log(`⚠️ Fell back to blob storage: ${cid}`);
      }
    } else {
      // Store in Vercel Blob Storage
      const blobResult = await put(filename, buffer, {
        access: 'public',
        contentType: type || 'application/octet-stream',
      });
      
      cid = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      storageUrl = blobResult.url;
    }

    // Store metadata in Vercel Postgres
    try {
      await sql`
        INSERT INTO uploads (
          id, 
          filename, 
          type, 
          size, 
          signature, 
          uploaded_by, 
          signed_message, 
          encrypted, 
          storage_url, 
          created_at
        )
        VALUES (
          ${cid}, 
          ${filename}, 
          ${type}, 
          ${buffer.length}, 
          ${signature || null}, 
          ${uploadedBy || null}, 
          ${signedMessage || null}, 
          ${encrypted || false}, 
          ${storageUrl}, 
          NOW()
        )
      `;
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue even if DB fails - file is still in blob storage
    }

    return res.status(200).json({ 
      success: true, 
      cid,
      storageUrl,
      filename,
      type,
      size: buffer.length,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
}
