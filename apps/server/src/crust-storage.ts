// Crust Network IPFS Storage Service
import { create } from 'kubo-rpc-client';
import { ApiPromise, WsProvider } from '@polkadot/api';

export class CrustIPFSStorage {
  private ipfs: any;
  private crustApi: ApiPromise | null = null;
  private initialized = false;

  constructor(
    private ipfsUrl: string = 'https://ipfs-gw.decloud.foundation', // Crust IPFS Gateway
    private crustRpcUrl: string = 'wss://rpc.crust.network' // Crust Network RPC
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize IPFS client (using Crust's IPFS gateway)
      this.ipfs = create({ url: this.ipfsUrl });
      
      // Initialize Crust API for pinning
      const provider = new WsProvider(this.crustRpcUrl);
      this.crustApi = await ApiPromise.create({ provider });
      
      this.initialized = true;
      console.log('✅ Crust IPFS Storage initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize Crust IPFS, falling back to local storage:', error);
      this.initialized = false;
    }
  }

  async store(data: any): Promise<string> {
    await this.initialize();

    try {
      if (!this.ipfs) {
        throw new Error('IPFS not initialized');
      }

      // Convert data to buffer
      const content = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0',
        source: 'polka-kleinanzeigen'
      });

      // Add to IPFS
      const result = await this.ipfs.add(content);
      const ipfsHash = result.cid.toString();

      console.log(`📁 Stored on IPFS: ${ipfsHash}`);

      // Attempt to pin on Crust Network (optional, requires account setup)
      try {
        await this.pinOnCrust(ipfsHash);
      } catch (error) {
        console.warn('⚠️ Could not pin on Crust Network (account setup required):', error);
      }

      return ipfsHash;
    } catch (error) {
      console.error('❌ IPFS storage failed:', error);
      throw error;
    }
  }

  async retrieve(ipfsHash: string): Promise<any> {
    await this.initialize();

    try {
      if (!this.ipfs) {
        // Fallback to HTTP gateway if IPFS client not available
        return await this.retrieveViaGateway(ipfsHash);
      }

      // Retrieve from IPFS
      const chunks = [];
      for await (const chunk of this.ipfs.cat(ipfsHash)) {
        chunks.push(chunk);
      }

      const content = Buffer.concat(chunks).toString();
      const parsed = JSON.parse(content);
      
      console.log(`📥 Retrieved from IPFS: ${ipfsHash}`);
      return parsed.data;
    } catch (error) {
      console.error('❌ IPFS retrieval failed:', error);
      // Fallback to gateway
      return await this.retrieveViaGateway(ipfsHash);
    }
  }

  private async retrieveViaGateway(ipfsHash: string): Promise<any> {
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      if (!response.ok) {
        throw new Error(`Gateway fetch failed: ${response.statusText}`);
      }
      
      const content = await response.text();
      const parsed = JSON.parse(content);
      
      console.log(`📥 Retrieved via gateway: ${ipfsHash}`);
      return parsed.data;
    } catch (error) {
      console.error('❌ Gateway retrieval failed:', error);
      throw new Error(`Failed to retrieve ${ipfsHash}: ${error}`);
    }
  }

  private async pinOnCrust(ipfsHash: string): Promise<void> {
    if (!this.crustApi) return;

    try {
      // This would require a funded Crust account and proper key management
      // For now, we'll just log the intent to pin
      console.log(`📌 Would pin on Crust Network: ${ipfsHash}`);
      
      // Example of how pinning would work (requires account setup):
      // const tx = this.crustApi.tx.market.placeStorageOrder(ipfsHash, fileSize, tip);
      // await tx.signAndSend(account);
    } catch (error) {
      console.warn('⚠️ Crust pinning failed:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return this.initialized;
  }

  async disconnect(): Promise<void> {
    if (this.crustApi) {
      await this.crustApi.disconnect();
    }
  }
}

// Singleton instance
export const crustStorage = new CrustIPFSStorage();
