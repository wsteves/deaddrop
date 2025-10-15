import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  maxDuration: 60,
};

interface UploadRequest {
  filename: string;
  data: number[] | { data: number[]; filename: string; type: string; [key: string]: any };
  type: string;
  signature?: string;
  uploadedBy?: string;
  signedMessage?: string;
  encrypted?: boolean;
  storageType?: 'local' | 'ipfs';
}

// Upload to IPFS using Crust Network Gateway (same as your original server)
async function uploadToCrustIPFS(content: string): Promise<string> {
  console.log('📡 Uploading to Crust Network IPFS...');
  
  try {
    // Use Crust Network gateway - same as your original crustStorage.ts
    const response = await fetch('https://gw.crustfiles.app/api/v0/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'deaddrop-data.json',
        content: content,
      }),
    });

    if (!response.ok) {
      throw new Error(`Crust upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const cid = result.Hash || result.cid || result.path;
    
    if (!cid) {
      throw new Error('No CID returned from Crust Network');
    }
    
    console.log(`✅ Uploaded to Crust IPFS: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ Crust IPFS upload error:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    
    let filename: string;
    let data: number[];
    let type: string;
    let signature: string | undefined;
    let uploadedBy: string | undefined;
    let signedMessage: string | undefined;
    let encrypted: boolean | undefined;
    
    // Handle wrapped data format from defaultStorage.store()
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
    
    const storageType = body.storageType || 'ipfs';

    if (!filename || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    const buffer = Buffer.from(data);

    if (storageType !== 'ipfs') {
      return res.status(400).json({ error: 'Only IPFS storage is supported' });
    }

    let cid: string;
    let storageUrl: string;

    try {
      console.log(`📦 Preparing ${filename} (${buffer.length} bytes) for IPFS upload...`);
      
      // Create content package (same format as original crustStorage.ts)
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
        network: 'crust'
      });

      cid = await uploadToCrustIPFS(content);
      storageUrl = `https://gw.crustfiles.app/ipfs/${cid}`;
      
      console.log(`🌐 File available at: ${storageUrl}`);
      
    } catch (ipfsError) {
      console.error('❌ IPFS upload failed:', ipfsError);
      throw new Error(`IPFS upload failed: ${ipfsError instanceof Error ? ipfsError.message : 'Unknown error'}`);
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
      console.log(`💾 Metadata saved to database`);
    } catch (dbError) {
      console.error('⚠️ Database error:', dbError);
      // Continue anyway - file is in IPFS
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
    console.error('❌ Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
}
