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
  const [textMessage, setTextMessage] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [storeRaw, setStoreRaw] = useState<boolean>(false);
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

  function createTextFile() {
    if (!textMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    // Create a File object from the text
    const blob = new Blob([textMessage], { type: 'text/plain' });
    const filename = `message-${Date.now()}.txt`;
    const file = new File([blob], filename, { type: 'text/plain' });
    
    setFiles(prev => [...prev, file]);
    setTextMessage('');
    setShowTextInput(false);
    toast.success('Text message added!');
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

          let id;
          if (storeRaw && !isEncrypted) {
            // Store as raw file (no JSON wrapper)
            const response = await fetch('http://localhost:4000/api/storage/store-raw', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: fileData,
                metadata: {
                  filename: f.name,
                  type: f.type,
                  size: f.size,
                  uploadedBy: walletAddress,
                  signature,
                  timestamp: payload.timestamp
                }
              })
            });
            const result = await response.json();
            id = result.id;
            toast.dismiss();
            toast.success(`✅ ${f.name} stored as raw file! Accessible at: ${result.url}`);
          } else {
            // Store with JSON wrapper (includes metadata)
            id = await defaultStorage.store(signedPayload);
          }
          
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
          <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          Upload to IPFS
        </h1>
        {walletAddress ? (
          <div className="flex items-center gap-2.5 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 inline-flex">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">
              Connected: <code className="text-xs bg-white px-2 py-1 rounded font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</code>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 inline-flex">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="font-medium text-orange-800">Connect your wallet to sign and upload files</span>
          </div>
        )}
      </div>

      {/* Elegant Tabbed Upload Interface */}
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-100 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <button
            onClick={() => setShowTextInput(false)}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
              !showTextInput
                ? 'bg-white text-purple-600 border-b-4 border-purple-600 shadow-lg'
                : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-lg">Upload Files</span>
            </div>
          </button>
          <button
            onClick={() => setShowTextInput(true)}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
              showTextInput
                ? 'bg-white text-pink-600 border-b-4 border-pink-600 shadow-lg'
                : 'text-pink-400 hover:text-pink-600 hover:bg-pink-50'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-lg">Write Message</span>
            </div>
          </button>
        </div>

        {/* File Upload Tab */}
        {!showTextInput && (
          <div className="p-8">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="border-3 border-dashed border-purple-300 rounded-2xl p-12 text-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 hover:border-purple-500 transition-all duration-300 group cursor-pointer"
              onClick={pickFiles}
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-900 mb-2">Drop files here</h3>
                <p className="text-purple-600 mb-6">or click to browse your device</p>
                <div className="flex items-center gap-2 text-sm text-purple-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Multiple files supported • Max 100MB per file</span>
                </div>
              </div>
            </div>
            <input ref={inputRef} type="file" multiple hidden onChange={handleFilesSelected} />
          </div>
        )}

        {/* Text Message Tab */}
        {showTextInput && (
          <div className="p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-pink-900">Write Your Message</h3>
                  <p className="text-sm text-pink-600">Create a text file directly in the browser</p>
                </div>
              </div>
              
              <textarea
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Type your message here... It will be saved as a .txt file"
                className="w-full h-64 border-2 border-pink-200 focus:border-pink-500 rounded-xl px-4 py-3 text-sm font-mono resize-none transition-colors shadow-inner"
                autoFocus
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={createTextFile}
                  disabled={!textMessage.trim()}
                  variant="primary"
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Message to Queue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Options Section */}
        <div className="px-8 pb-6 border-t-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-3xl mx-auto pt-6 space-y-4">
            {/* Password Protection */}
            <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-md">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={usePassword}
                  onChange={(e) => {
                    setUsePassword(e.target.checked);
                    if (!e.target.checked) setStoreRaw(false);
                  }}
                  className="w-5 h-5 text-purple-600 rounded mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className={`w-5 h-5 ${usePassword ? 'text-green-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {usePassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <span className="font-bold text-purple-900">
                      {usePassword ? '🔒 Password Protection Enabled' : '🌐 Public Upload'}
                    </span>
                  </div>
                  <p className={`text-sm ${usePassword ? 'text-green-700' : 'text-amber-700'}`}>
                    {usePassword
                      ? '✓ Files will be encrypted with AES-256. Only password holders can decrypt.'
                      : '⚠ Files will be publicly accessible via IPFS gateways. Anyone with the link can read them.'}
                  </p>
                </div>
              </label>
              
              {usePassword && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="block text-sm font-semibold text-purple-900 mb-2">Encryption Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className="w-full border-2 border-purple-300 focus:border-purple-500 rounded-lg px-4 py-3 text-sm transition-colors"
                  />
                  <p className="text-xs text-purple-600 mt-2">⚠️ Save this password! There's no recovery if you lose it.</p>
                </div>
              )}
          
            </div>

            {/* Raw Storage Option - only show if not encrypted */}
            {!usePassword && (
              <div className="bg-white rounded-xl p-5 border-2 border-pink-200 shadow-md">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={storeRaw}
                    onChange={(e) => setStoreRaw(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-bold text-pink-900">Raw File Storage</span>
                      <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs font-semibold rounded-full">Recommended</span>
                    </div>
                    <p className="text-sm text-pink-700">
                      ✓ Store files without JSON wrapper - perfect for public plain text files<br/>
                      ✓ Viewable directly via any IPFS gateway (ipfs.io, cloudflare, etc.)<br/>
                      ⚠️ Metadata (signature, filename) stored separately
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="px-8 pb-8 pt-6 bg-white">
            <div className="flex justify-center">
              <Button 
                onClick={uploadAll} 
                variant="dropout" 
                disabled={uploading || files.length===0 || !walletAddress || (usePassword && !password)}
                className="px-12 py-4 text-lg font-bold flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    <span className="text-xl">Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8" />
                    </svg>
                    <span className="text-xl">Sign & Upload {files.length > 0 ? `(${files.length})` : 'All'}</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 bg-white p-5 rounded-xl border-2 border-purple-100 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-bold text-purple-900">Upload Queue ({files.length})</h3>
            </div>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          </div>
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={i} className="group flex items-center gap-3 p-3 rounded-lg border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  {f.type === 'text/plain' && f.name.startsWith('message-') ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-purple-900 truncate">{f.name}</div>
                    {f.type === 'text/plain' && f.name.startsWith('message-') && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        💬 Text Message
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-purple-600 flex items-center gap-2">
                    <span>{Math.round(f.size/1024)} KB</span>
                    <span>•</span>
                    <span>{f.type || 'unknown'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
