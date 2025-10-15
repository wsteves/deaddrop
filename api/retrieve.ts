import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Check if it's a local file or IPFS CID
    if (id.startsWith('local_')) {
      // Retrieve from database
      const result = await sql`
        SELECT * FROM uploads WHERE id = ${id}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'File not found',
          message: 'Local files may be lost if server restarts'
        });
      }

      const record = result.rows[0];

      // Fetch from Vercel Blob Storage
      if (record.storage_url) {
        try {
          const response = await fetch(record.storage_url);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch from blob storage: ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const dataArray = Array.from(new Uint8Array(arrayBuffer));

          return res.status(200).json({
            filename: record.filename,
            type: record.type,
            size: record.size,
            data: dataArray,
            signature: record.signature,
            uploadedBy: record.uploaded_by,
            signedMessage: record.signed_message,
            encrypted: record.encrypted,
          });
        } catch (fetchError) {
          console.error('Blob storage fetch error:', fetchError);
          return res.status(500).json({ 
            error: 'Failed to retrieve file from storage',
            message: (fetchError as Error).message
          });
        }
      } else {
        return res.status(404).json({ error: 'Storage URL not found' });
      }
    } else {
      // Retrieve from IPFS using public gateways
      const ipfsGateways = [
        `https://ipfs.io/ipfs/${id}`,
        `https://cloudflare-ipfs.com/ipfs/${id}`,
        `https://dweb.link/ipfs/${id}`,
        `https://w3s.link/ipfs/${id}`,
      ];

      let lastError: Error | null = null;

      // Try each gateway until one works
      for (const gateway of ipfsGateways) {
        try {
          const response = await fetch(gateway, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (response.ok) {
            const text = await response.text();
            
            // Try to parse as JSON package (new format)
            try {
              const jsonPackage = JSON.parse(text);
              
              // Check if it's the wrapped format
              if (jsonPackage.data && jsonPackage.data.data) {
                const fileData = jsonPackage.data;
                return res.status(200).json({
                  filename: fileData.filename || 'file',
                  type: fileData.type || 'application/octet-stream',
                  size: fileData.size || fileData.data.length,
                  data: fileData.data,
                  signature: jsonPackage.signature || null,
                  uploadedBy: jsonPackage.uploadedBy || null,
                  signedMessage: jsonPackage.signedMessage || null,
                  encrypted: fileData.encrypted || false,
                });
              }
            } catch (parseError) {
              // Not JSON or wrong format, treat as raw binary
              console.log('Could not parse as JSON package, treating as raw binary');
            }

            // Fallback: treat as raw binary (old format or non-wrapped data)
            const arrayBuffer = new TextEncoder().encode(text);
            const dataArray = Array.from(new Uint8Array(arrayBuffer));

            // Try to get metadata from database if available
            let metadata = {
              filename: 'file',
              type: 'application/octet-stream',
              signature: null,
              uploadedBy: null,
              signedMessage: null,
              encrypted: false,
            };

            try {
              const dbResult = await sql`
                SELECT * FROM uploads WHERE id = ${id}
              `;
              if (dbResult.rows.length > 0) {
                const record = dbResult.rows[0];
                metadata = {
                  filename: record.filename,
                  type: record.type,
                  signature: record.signature,
                  uploadedBy: record.uploaded_by,
                  signedMessage: record.signed_message,
                  encrypted: record.encrypted,
                };
              }
            } catch (dbError) {
              // DB query failed, use default metadata
              console.error('DB query error:', dbError);
            }

            return res.status(200).json({
              filename: metadata.filename,
              type: metadata.type,
              size: dataArray.length,
              data: dataArray,
              signature: metadata.signature,
              uploadedBy: metadata.uploadedBy,
              signedMessage: metadata.signedMessage,
              encrypted: metadata.encrypted,
            });
          }
        } catch (error) {
          lastError = error as Error;
          console.error(`Gateway ${gateway} failed:`, error);
          continue;
        }
      }

      // All gateways failed
      return res.status(404).json({ 
        error: 'File not found on IPFS',
        message: lastError?.message || 'All IPFS gateways failed',
      });
    }

  } catch (error: any) {
    console.error('Retrieve error:', error);
    return res.status(500).json({ 
      error: 'Retrieval failed', 
      message: error.message 
    });
  }
}
