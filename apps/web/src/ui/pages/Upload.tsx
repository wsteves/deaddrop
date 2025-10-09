import React, { useState, useRef, useEffect } from 'react';
import { defaultStorage } from '../../lib/storage';
import { Button } from '../components/DesignSystem';
import toast from 'react-hot-toast';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { stringToHex } from '@polkadot/util';

// Encryption/Decryption helpers using Web Crypto API
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Convert Uint8Array to ArrayBuffer for Web Crypto API
  const saltBuffer = new Uint8Array(salt).buffer;
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  // Convert Uint8Array to ArrayBuffer for Web Crypto API
  const dataBuffer = new Uint8Array(data).buffer;
  const ivBuffer = new Uint8Array(iv).buffer;
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    dataBuffer
  );
  
  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return result;
}

export async function decryptData(encryptedData: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 28);
  const data = encryptedData.slice(28);
  
  const key = await deriveKey(password, salt);
  
  // Convert Uint8Array to ArrayBuffer for Web Crypto API
  const ivBuffer = new Uint8Array(iv).buffer;
  const dataBuffer = new Uint8Array(data).buffer;
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    dataBuffer
  );
  
  return new Uint8Array(decrypted);
}

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<Array<{ id: string; name: string; signature?: string; encrypted?: boolean; txHash?: string }>>([]);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      setWalletAddress(localStorage.getItem('walletAddress') || '');
    } catch {}

    function onConnect(e: any) {
      setWalletAddress(e?.detail?.address || localStorage.getItem('walletAddress') || '');
    }

    function onDisconnect() {
      setWalletAddress('');
    }

    window.addEventListener('wallet:connected', onConnect as any);
    window.addEventListener('wallet:disconnected', onDisconnect as any);
    return () => {
      window.removeEventListener('wallet:connected', onConnect as any);
      window.removeEventListener('wallet:disconnected', onDisconnect as any);
    };
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    setFiles(prev => prev.concat(dropped));
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function pickFiles() {
    inputRef.current?.click();
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    setFiles(prev => prev.concat(chosen));
  }

  async function uploadAll() {
    if (!files.length) return toast.error('No files selected');
    
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setUploading(true);
    const res: Array<{ id: string; name: string; signature?: string; encrypted?: boolean; txHash?: string }> = [];
    
    try {
      // Enable web3 extension first
      const { web3Enable } = await import('@polkadot/extension-dapp');
      const extensions = await web3Enable('DripDrop');
      
      if (!extensions || extensions.length === 0) {
        throw new Error('Please install and authorize Polkadot wallet extension');
      }

      // Get the injector for signing
      const injector = await web3FromAddress(walletAddress);

      for (const f of files) {
        try {
          const array = await f.arrayBuffer();
          let fileData = Array.from(new Uint8Array(array));
          let isEncrypted = false;

          // Encrypt if password is provided
          if (usePassword && password) {
            try {
              const encrypted = await encryptData(new Uint8Array(array), password);
              fileData = Array.from(encrypted);
              isEncrypted = true;
              toast.loading(`🔒 Encrypting ${f.name}...`);
            } catch (encErr) {
              toast.dismiss();
              toast.error(`Encryption failed for ${f.name}`);
              continue;
            }
          }

          const payload = {
            filename: f.name,
            type: f.type,
            size: f.size,
            data: fileData,
            uploadedBy: walletAddress,
            timestamp: Date.now(),
            encrypted: isEncrypted,
          };

          // Create a message to sign (hash of file metadata)
          const message = `DripDrop Upload: ${f.name} (${f.size} bytes) at ${payload.timestamp}`;
          
          // Sign the message with the wallet
          toast.loading(`Signing ${f.name}...`);
          const signRaw = injector?.signer?.signRaw;
          if (!signRaw) {
            throw new Error('Wallet does not support signing');
          }

          const { signature } = await signRaw({
            address: walletAddress,
            data: stringToHex(message),
            type: 'bytes'
          });

          toast.dismiss();
          toast.loading(`Uploading ${f.name} to IPFS...`);

          // Add signature to payload
          const signedPayload = {
            ...payload,
            signature,
            signedMessage: message,
          };

          const id = await defaultStorage.store(signedPayload);
          
          // Store CID on-chain using system.remark
          let txHash = '';
          try {
            toast.dismiss();
            toast.loading(`📝 Storing on-chain record...`);
            
            const { ApiPromise, WsProvider } = await import('@polkadot/api');
            const provider = new WsProvider('wss://westend-rpc.polkadot.io');
            const api = await ApiPromise.create({ provider });
            
            // Create remark with IPFS CID and metadata
            const remarkData = {
              app: 'DripDrop',
              version: '1.0',
              cid: id,
              filename: f.name,
              size: f.size,
              timestamp: payload.timestamp,
              encrypted: isEncrypted
            };
            const remarkJson = JSON.stringify(remarkData);
            
            // Submit remark transaction
            const tx = api.tx.system.remark(remarkJson);
            
            await new Promise((resolve, reject) => {
              tx.signAndSend(walletAddress, { signer: injector.signer }, ({ status, txHash: hash }) => {
                if (status.isInBlock || status.isFinalized) {
                  txHash = hash.toHex();
                  console.log(`✅ On-chain record stored in block. TxHash: ${txHash}`);
                  resolve(txHash);
                } else if (status.isInvalid || status.isDropped) {
                  reject(new Error('Transaction failed'));
                }
              }).catch(reject);
            });
            
            await api.disconnect();
          } catch (remarkErr) {
            console.warn('⚠️ On-chain storage failed (optional):', remarkErr);
            // Continue anyway - on-chain storage is optional
          }
          
          res.push({ id, name: f.name, signature, encrypted: isEncrypted, txHash });
          saveRecent({ id, name: f.name, size: f.size, type: f.type, signature, uploadedBy: walletAddress, txHash });
          
          toast.dismiss();
          const encryptedMsg = isEncrypted ? ' & encrypted' : '';
          const onChainMsg = txHash ? ' & stored on-chain' : '';
          toast.success(`✓ ${f.name} uploaded${encryptedMsg} & signed${onChainMsg}`);
        } catch (err: any) {
          toast.dismiss();
          console.error('Upload failed', err);
          if (err.message?.includes('Cancelled')) {
            toast.error(`Signature cancelled for ${f.name}`);
          } else {
            toast.error(`Failed: ${f.name}`);
          }
        }
      }
    } catch (err: any) {
      toast.dismiss();
      console.error('Wallet error', err);
      toast.error('Failed to access wallet: ' + (err.message || String(err)));
    }

    setResults(res);
    setFiles([]);
    setUploading(false);
  }

  function saveRecent(item: { id: string; name: string; size: number; type: string; signature?: string; uploadedBy?: string; txHash?: string }) {
    try {
      const raw = localStorage.getItem('dripdrop:recent') || '[]';
      const arr = JSON.parse(raw);
      arr.unshift({ ...item, when: Date.now() });
      localStorage.setItem('dripdrop:recent', JSON.stringify(arr.slice(0, 50)));
    } catch {}
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Upload files to IPFS</h1>
        {walletAddress ? (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[var(--text-secondary)]">
              Wallet connected: <code className="text-xs bg-[var(--surface)] px-2 py-1 rounded">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</code>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Connect your wallet to sign and upload files</span>
          </div>
        )}
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-dashed border-2 border-[var(--border)] rounded-lg p-8 text-center bg-white"
      >
        <p className="mb-4 text-[var(--text-secondary)]">Drag and drop files here, or</p>
        
        {/* Password Protection Option */}
        <div className="mb-4 max-w-md mx-auto">
          <label className="flex items-center gap-2 justify-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm font-medium">🔒 Encrypt with password</span>
          </label>
          {usePassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter encryption password"
              className="mt-2 w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <input ref={inputRef} type="file" multiple hidden onChange={handleFilesSelected} />
          <Button onClick={pickFiles} variant="primary">Choose files</Button>
          <Button 
            onClick={uploadAll} 
            variant="dropout" 
            disabled={uploading || files.length===0 || !walletAddress || (usePassword && !password)}
          >
            {uploading ? 'Uploading...' : 'Sign & Upload all'}
          </Button>
        </div>
        {!walletAddress && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            💡 Files will be signed with your wallet for authenticity
          </p>
        )}
        {usePassword && !password && (
          <p className="mt-3 text-xs text-orange-600">
            ⚠️ Please enter a password to encrypt files
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-lg">
          <h3 className="font-medium">Files to upload</h3>
          <ul className="mt-2 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{f.name}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{Math.round(f.size/1024)} KB • {f.type || 'unknown'}</div>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">{i+1}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-medium text-green-800">Upload results</h3>
          </div>
          <ul className="mt-2 space-y-3">
            {results.map(r => (
              <li key={r.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      {r.name}
                      {r.encrypted && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">🔒 Encrypted</span>
                      )}
                      {r.signature && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">✓ Signed</span>
                      )}
                      {r.txHash && (
                        <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">⛓️ On-chain</span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">
                      ID: <code className="text-xs bg-white px-2 py-1 rounded">{r.id}</code>
                    </div>
                    {r.signature && (
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        Signature: <code className="text-xs">{r.signature.slice(0, 20)}...{r.signature.slice(-10)}</code>
                      </div>
                    )}
                    {r.txHash && (
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        Transaction: <code className="text-xs">{r.txHash.slice(0, 10)}...{r.txHash.slice(-8)}</code>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a 
                    href={`/browse?id=${encodeURIComponent(r.id)}`} 
                    className="text-xs text-purple-700 hover:underline font-medium"
                  >
                    📄 View Details
                  </a>
                  {!r.id.startsWith('local_') && (
                    <>
                      <span className="text-gray-300">•</span>
                      <a 
                        href={`https://ipfs.io/ipfs/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-700 hover:underline font-medium"
                      >
                        📦 IPFS Gateway
                      </a>
                    </>
                  )}
                  {r.txHash && (
                    <>
                      <span className="text-gray-300">•</span>
                      <a 
                        href={`https://westend.subscan.io/extrinsic/${r.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-700 hover:underline font-medium"
                      >
                        ⛓️ View on Subscan
                      </a>
                    </>
                  )}
                  {walletAddress && (
                    <>
                      <span className="text-gray-300">•</span>
                      <a 
                        href={`https://westend.subscan.io/account/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-700 hover:underline font-medium"
                      >
                        � Account
                      </a>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
