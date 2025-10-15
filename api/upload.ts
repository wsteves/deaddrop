import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

interface UploadRequest {
  filename: string;
  data: number[];
  type: string;
  signature?: string;
  uploadedBy?: string;
  signedMessage?: string;
  encrypted?: boolean;
  storageType: 'local' | 'ipfs';
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
    const { filename, data, type, signature, uploadedBy, signedMessage, encrypted, storageType } = body;

    if (!filename || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    let cid: string;
    let storageUrl: string | null = null;

    // Convert array of numbers to Buffer
    const buffer = Buffer.from(data);

    if (storageType === 'ipfs') {
      // For IPFS, use a public gateway with the Web3.Storage API
      // You'll need to set IPFS_API_TOKEN in Vercel env vars
      const formData = new FormData();
      const blob = new Blob([buffer], { type: type || 'application/octet-stream' });
      formData.append('file', blob, filename);

      const ipfsApiToken = process.env.IPFS_API_TOKEN;
      
      if (ipfsApiToken) {
        try {
          const response = await fetch('https://api.web3.storage/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ipfsApiToken}`,
            },
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            cid = result.cid;
            storageUrl = `https://w3s.link/ipfs/${cid}`;
          } else {
            throw new Error('IPFS upload failed');
          }
        } catch (ipfsError) {
          console.error('IPFS upload error, falling back to blob storage:', ipfsError);
          // Fallback to blob storage
          const blobResult = await put(filename, buffer, {
            access: 'public',
            contentType: type || 'application/octet-stream',
          });
          cid = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          storageUrl = blobResult.url;
        }
      } else {
        // No IPFS token, use blob storage
        const blobResult = await put(filename, buffer, {
          access: 'public',
          contentType: type || 'application/octet-stream',
        });
        cid = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        storageUrl = blobResult.url;
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
