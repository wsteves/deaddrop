// Storage service for decentralized file storage
// Updated to work with Vercel serverless API routes

// Get API base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin in production, localhost in dev
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5173'
      : window.location.origin;
  }
  return 'http://localhost:5173';
};

export interface StorageProvider {
  store(data: any): Promise<string>; // Returns content hash/ID
  retrieve(id: string): Promise<any>; // Returns stored data
  pin?(id: string): Promise<void>; // Optional pinning for IPFS
}

export interface CrustNetworkStatus {
  connected: boolean;
  accountAddress: string;
  balance: string;
  gatewayUrl: string;
  network: string;
}

export interface StorageOrderInfo {
  cid: string;
  fileSize: number;
  orderStatus: 'pending' | 'success' | 'failed' | 'expired';
  replicaCount: number;
  expiresAt: number;
  amount: string;
  gatewayUrl: string;
  explorerUrl: string;
}

// Fetch Crust Network status from server
export async function getCrustNetworkStatus(baseUrl: string = 'http://localhost:4000'): Promise<CrustNetworkStatus> {
  const response = await fetch(`${baseUrl}/api/crust/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Crust status: ${response.statusText}`);
  }
  return response.json();
}

// Get storage order information for a CID
export async function getStorageOrderInfo(cid: string, baseUrl: string = 'http://localhost:4000'): Promise<StorageOrderInfo> {
  const response = await fetch(`${baseUrl}/api/crust/order/${cid}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch storage order: ${response.statusText}`);
  }
  return response.json();
}

// Local storage provider (for development)
export class LocalStorageProvider implements StorageProvider {
  private keyPrefix = 'ipfs_job_';

  async store(data: any): Promise<string> {
    const id = this.generateId();
    const key = this.keyPrefix + id;
    localStorage.setItem(key, JSON.stringify({
      id,
      data,
      timestamp: Date.now(),
      version: '1.0'
    }));
    return id;
  }

  async retrieve(id: string): Promise<any> {
    const key = this.keyPrefix + id;
    const stored = localStorage.getItem(key);
    if (!stored) throw new Error(`Content not found: ${id}`);
    const parsed = JSON.parse(stored);
    return parsed.data;
  }

  private generateId(): string {
    // Simple ID generation (in real IPFS this would be content-addressed)
    return 'local_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Vercel API-backed storage (uses serverless functions)
export class ServerStorageProvider implements StorageProvider {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiBaseUrl();
  }

  async store(data: any): Promise<string> {
    console.log(`📡 Sending to Vercel API: ${this.baseUrl}/api/upload`);
    
    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server responded with ${response.status}: ${errorText}`);
      throw new Error(`Storage failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`🌐 Server returned CID: ${result.cid}`);
    return result.cid;
  }

  async retrieve(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/retrieve?id=${encodeURIComponent(id)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Retrieval failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  }

  async pin(id: string): Promise<void> {
    // Pinning is handled automatically by Vercel Blob Storage
    console.log(`📌 File ${id} is automatically persisted in Vercel Blob Storage`);
  }
}

// Storage manager that handles fallbacks and caching
export class StorageManager {
  private providers: StorageProvider[];
  private cache = new Map<string, any>();

  constructor(providers: StorageProvider[]) {
    this.providers = providers;
  }

  async store(data: any): Promise<string> {
    // Add metadata
    const enrichedData = {
      ...data,
      storedAt: Date.now(),
      version: '1.0'
    };

    // Try providers in order
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const providerName = provider.constructor.name;
      
      try {
        console.log(`🔄 Attempting to store with ${providerName}...`);
        const id = await provider.store(enrichedData);
        this.cache.set(id, enrichedData);
        console.log(`✅ Successfully stored with ${providerName}: ${id}`);
        return id;
      } catch (error) {
        console.warn(`❌ ${providerName} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All storage providers failed');
  }

  async retrieve(id: string): Promise<any> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        const data = await provider.retrieve(id);
        this.cache.set(id, data);
        return data;
      } catch (error) {
        console.warn('Storage retrieval failed:', error);
        continue;
      }
    }
    
    throw new Error(`Content not found: ${id}`);
  }

  async pin(id: string): Promise<void> {
    for (const provider of this.providers) {
      if (provider.pin) {
        try {
          await provider.pin(id);
        } catch (error) {
          console.warn('Pinning failed:', error);
        }
      }
    }
  }
}

// Default storage setup for Vercel
export function createDefaultStorage(): StorageManager {
  const providers: StorageProvider[] = [];

  // Add Vercel serverless API provider
  try {
    const serverProvider = new ServerStorageProvider();
    providers.push(serverProvider);
    console.log('✅ Vercel API Provider initialized - using serverless functions + blob storage');
  } catch (error) {
    console.warn('⚠️ Vercel API storage not available:', error);
  }

  // Always add local storage as fallback for offline use
  providers.push(new LocalStorageProvider());
  console.log(`📦 Storage providers: ${providers.map(p => p.constructor.name).join(', ')}`);

  return new StorageManager(providers);
}

// Export default instance
export const defaultStorage = createDefaultStorage();
