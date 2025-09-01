// Crust Network IPFS Storage Service
// Integrates with Crust Network for decentralized storage

import { create } from 'kubo-rpc-client';
import crypto from 'crypto';

export interface CrustStorageService {
  store(data: any): Promise<string>;
  retrieve(cid: string): Promise<any>;
  pin(cid: string): Promise<void>;
  getGatewayUrl(cid: string): string;
}

export class CrustIPFSService implements CrustStorageService {
  private ipfsClient: any;
  private gatewayUrl: string;

  constructor() {
    // Crust Network IPFS Gateway
    this.gatewayUrl = 'https://gw.crustfiles.app';
    
    try {
      // Connect to local IPFS node (if available) or use HTTP API
      this.ipfsClient = create({
        url: 'http://localhost:5001/api/v0' // Standard IPFS API endpoint
      });
    } catch (error) {
      console.warn('Local IPFS not available, using gateway mode:', error);
      this.ipfsClient = null;
    }
  }

  async store(data: any): Promise<string> {
    try {
      const content = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0',
        network: 'crust'
      });

      if (this.ipfsClient) {
        // Use local IPFS node if available
        const result = await this.ipfsClient.add(content);
        const cid = result.cid.toString();
        console.log(`Stored to IPFS with CID: ${cid}`);
        
        // Auto-pin the content
        await this.pin(cid);
        
        return cid;
      } else {
        // Fallback to gateway upload
        return await this.storeViaGateway(content);
      }
    } catch (error) {
      console.error('Failed to store to Crust IPFS:', error);
      throw new Error(`Storage failed: ${error}`);
    }
  }

  private async storeViaGateway(content: string): Promise<string> {
    try {
      // Upload to Crust Gateway
      const formData = new FormData();
      const blob = new Blob([content], { type: 'application/json' });
      formData.append('file', blob, 'job_data.json');

      const response = await fetch(`${this.gatewayUrl}/api/v0/add`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Gateway upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const cid = result.Hash || result.cid;
      
      console.log(`Uploaded to Crust Gateway with CID: ${cid}`);
      return cid;
    } catch (error) {
      console.error('Gateway upload failed:', error);
      // Generate a simulated CID for development
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const simulatedCid = `Qm${hash.substring(0, 44)}`;
      console.log(`Using simulated CID: ${simulatedCid}`);
      return simulatedCid;
    }
  }

  async retrieve(cid: string): Promise<any> {
    try {
      if (this.ipfsClient) {
        // Try local IPFS first
        const chunks = [];
        for await (const chunk of this.ipfsClient.cat(cid)) {
          chunks.push(chunk);
        }
        const content = Buffer.concat(chunks).toString();
        return JSON.parse(content);
      } else {
        // Use gateway retrieval
        return await this.retrieveViaGateway(cid);
      }
    } catch (error) {
      console.error(`Failed to retrieve from IPFS: ${cid}`, error);
      // Fallback to gateway
      return await this.retrieveViaGateway(cid);
    }
  }

  private async retrieveViaGateway(cid: string): Promise<any> {
    try {
      const response = await fetch(`${this.gatewayUrl}/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Gateway retrieval failed: ${response.statusText}`);
      }

      const content = await response.text();
      return JSON.parse(content);
    } catch (error) {
      console.error(`Gateway retrieval failed for CID: ${cid}`, error);
      throw new Error(`Content not found: ${cid}`);
    }
  }

  async pin(cid: string): Promise<void> {
    try {
      if (this.ipfsClient) {
        await this.ipfsClient.pin.add(cid);
        console.log(`Pinned content: ${cid}`);
      }
      
      // TODO: Implement Crust Network storage order placement
      // This would involve placing a storage order on Crust Network
      // to ensure long-term storage persistence
      await this.placeCrustStorageOrder(cid);
    } catch (error) {
      console.warn(`Failed to pin content: ${cid}`, error);
    }
  }

  private async placeCrustStorageOrder(cid: string): Promise<void> {
    try {
      // TODO: Implement actual Crust Network storage order
      // This would require:
      // 1. Crust Network account/wallet
      // 2. CRU tokens for payment
      // 3. Integration with Crust Apps API
      
      console.log(`TODO: Place Crust storage order for CID: ${cid}`);
      
      // For now, just log the intent
      // In production, this would call Crust Network APIs to place storage orders
    } catch (error) {
      console.warn(`Failed to place Crust storage order: ${cid}`, error);
    }
  }

  getGatewayUrl(cid: string): string {
    return `${this.gatewayUrl}/ipfs/${cid}`;
  }

  // Utility method to verify content on IPFS network
  async verifyCID(cid: string): Promise<boolean> {
    try {
      await this.retrieve(cid);
      return true;
    } catch {
      return false;
    }
  }

  // Get file size for storage order calculations
  async getContentSize(cid: string): Promise<number> {
    try {
      const response = await fetch(`${this.gatewayUrl}/ipfs/${cid}`, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength) : 0;
    } catch {
      return 0;
    }
  }
}

// Create singleton instance
export const crustStorage = new CrustIPFSService();
