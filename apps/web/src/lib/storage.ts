// Storage service for decentralized job postings
// Now uses real Crust Network IPFS with storage orders and CRU token payments

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

// Server-backed storage (proxies to backend which can use real IPFS)
export class ServerStorageProvider implements StorageProvider {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  async store(data: any): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/storage/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) {
      throw new Error(`Storage failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.id;
  }

  async retrieve(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/storage/retrieve/${id}`);
    
    if (!response.ok) {
      throw new Error(`Retrieval failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  async pin(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/storage/pin/${id}`, { method: 'POST' });
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
    for (const provider of this.providers) {
      try {
        const id = await provider.store(enrichedData);
        this.cache.set(id, enrichedData);
        return id;
      } catch (error) {
        console.warn('Storage provider failed:', error);
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

// Default storage setup
export function createDefaultStorage(): StorageManager {
  const providers: StorageProvider[] = [];

  // Add server provider if available
  try {
    providers.push(new ServerStorageProvider());
  } catch {
    console.warn('Server storage not available');
  }

  // Always add local storage as fallback
  providers.push(new LocalStorageProvider());

  return new StorageManager(providers);
}

// Export default instance
export const defaultStorage = createDefaultStorage();
