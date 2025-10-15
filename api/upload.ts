import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
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

// Simple FormData implementation for IPFS upload
class SimpleFormData {
  private boundary: string;
  private parts: Buffer[] = [];

  constructor() {
    this.boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
  }

  append(name: string, value: Buffer | string, filename?: string) {
    let header = `--${this.boundary}\r\n`;
    
    if (filename) {
      header += `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`;
      header += 'Content-Type: application/octet-stream\r\n\r\n';
    } else {
      header += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
    }
    
    this.parts.push(Buffer.from(header));
    this.parts.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
    this.parts.push(Buffer.from('\r\n'));
  }

  getBuffer(): Buffer {
    const end = Buffer.from(`--${this.boundary}--\r\n`);
    return Buffer.concat([...this.parts, end]);
  }

  getContentType(): string {
    return `multipart/form-data; boundary=${this.boundary}`;
  }
}

async function uploadToIPFS(content: string): Promise<string> {
  console.log('📡 Starting IPFS upload...');
  
  const formData = new SimpleFormData();
  formData.append('file', Buffer.from(content), 'data.json');

  try {
    const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
      method: 'POST',
      headers: {
        'Content-Type': formData.getContentType(),
      },
      body: formData.getBuffer(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IPFS upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ IPFS upload successful:', result.Hash);
    return result.Hash;
  } catch (error) {
    console.error('❌ IPFS upload error:', error);
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
    
    // Handle wrapped data format
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

    let cid: string;
    let storageUrl: string | null = null;
    const buffer = Buffer.from(data);

    if (storageType === 'ipfs') {
      try {
        console.log(`📦 Preparing ${filename} (${buffer.length} bytes) for IPFS upload...`);
        
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

        cid = await uploadToIPFS(content);
        storageUrl = `https://ipfs.io/ipfs/${cid}`;
        
        console.log(`🌐 File available at: ${storageUrl}`);
        
      } catch (ipfsError) {
        console.error('⚠️ IPFS failed, using blob storage:', ipfsError);
        
        const blobResult = await put(filename, buffer, {
          access: 'public',
          contentType: type || 'application/octet-stream',
        });
        cid = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        storageUrl = blobResult.url;
        
        console.log(`💾 Blob storage: ${cid}`);
      }
    } else {
      const blobResult = await put(filename, buffer, {
        access: 'public',
        contentType: type || 'application/octet-stream',
      });
      
      cid = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      storageUrl = blobResult.url;
    }

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
      console.error('⚠️ Database error:', dbError);
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
