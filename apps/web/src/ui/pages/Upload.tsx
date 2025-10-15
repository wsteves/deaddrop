import React, { useState, useRef, useEffect } from 'react';
import { defaultStorage } from '../../lib/storage';
import { Button } from '../components/DesignSystem';
import { FileCard } from '../components/FileCard';
import { Confetti } from '../components/Confetti';
import { SuccessModal } from '../components/SuccessModal';
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Array<{ id: string; name: string; signature?: string; encrypted?: boolean; txHash?: string }>>([]);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(false);
  const [textMessage, setTextMessage] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [storeRaw, setStoreRaw] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} ${newFiles.length === 1 ? 'file' : 'files'} to queue!`);
      
      // Scroll to upload button after a short delay
      setTimeout(() => {
        const uploadButton = document.querySelector('[data-upload-button]');
        if (uploadButton) {
          uploadButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }

  function pickFiles() {
    inputRef.current?.click();
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    setFiles(prev => prev.concat(chosen));
    
    // Scroll to upload button after a short delay
    setTimeout(() => {
      const uploadButton = document.querySelector('[data-upload-button]');
      if (uploadButton) {
        uploadButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
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
    
    // Scroll to upload button after a short delay
    setTimeout(() => {
      const uploadButton = document.querySelector('[data-upload-button]');
      if (uploadButton) {
        uploadButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
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
          // Initialize progress for this file
          setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
          
          const array = await f.arrayBuffer();
          let fileData = Array.from(new Uint8Array(array));
          let isEncrypted = false;

          // Encrypt if password is provided
          if (usePassword && password) {
            try {
              setUploadProgress(prev => ({ ...prev, [f.name]: 10 }));
              const encrypted = await encryptData(new Uint8Array(array), password);
              fileData = Array.from(encrypted);
              isEncrypted = true;
              toast.loading(`🔒 Encrypting ${f.name}...`);
              setUploadProgress(prev => ({ ...prev, [f.name]: 25 }));
            } catch (encErr) {
              toast.dismiss();
              toast.error(`Encryption failed for ${f.name}`);
              setUploadProgress(prev => ({ ...prev, [f.name]: -1 })); // Error state
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
          setUploadProgress(prev => ({ ...prev, [f.name]: usePassword ? 35 : 15 }));
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
          setUploadProgress(prev => ({ ...prev, [f.name]: usePassword ? 50 : 40 }));

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
            setUploadProgress(prev => ({ ...prev, [f.name]: 70 }));
            toast.dismiss();
            toast.success(`✅ ${f.name} stored as raw file! Accessible at: ${result.url}`);
          } else {
            // Store with JSON wrapper (includes metadata)
            id = await defaultStorage.store(signedPayload);
            setUploadProgress(prev => ({ ...prev, [f.name]: 70 }));
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
          
          setUploadProgress(prev => ({ ...prev, [f.name]: 100 }));
          res.push({ id, name: f.name, signature, encrypted: isEncrypted, txHash });
          saveRecent({ id, name: f.name, size: f.size, type: f.type, signature, uploadedBy: walletAddress, txHash });
          
          toast.dismiss();
          const encryptedMsg = isEncrypted ? ' & encrypted' : '';
          const onChainMsg = txHash ? ' & stored on-chain' : '';
          toast.success(`✓ ${f.name} uploaded${encryptedMsg} & signed${onChainMsg}`);
        } catch (err: any) {
          toast.dismiss();
          setUploadProgress(prev => ({ ...prev, [f.name]: -1 })); // Error state
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
    setUploadProgress({});
    
    // Show celebration if all files uploaded successfully
    if (res.length > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
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
    <div className="container mx-auto px-6 py-12">
      {/* Confetti */}
      <Confetti show={showCelebration} />
      
      {/* Success Modal */}
      <SuccessModal 
        show={results.length > 0 && !uploading}
        onClose={() => setResults([])}
        results={results}
        walletAddress={walletAddress}
      />
      
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4 animate-in slide-up">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-float">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </div>
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              Upload to IPFS
            </h1>
            <p className="text-purple-300 text-lg">Decentralized, encrypted, and permanent storage</p>
          </div>
        </div>
        
        {walletAddress ? (
          <div className="flex items-center gap-3 text-sm bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3 inline-flex backdrop-blur-sm animate-in fade-in">
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-300 font-medium">
              Connected: <code className="text-xs bg-green-500/20 px-2.5 py-1 rounded-lg font-mono text-green-200 border border-green-500/30">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</code>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm bg-orange-500/10 border border-orange-500/30 rounded-xl px-5 py-3 inline-flex backdrop-blur-sm animate-in fade-in">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="font-medium text-orange-300">Connect your wallet to sign and upload files</span>
          </div>
        )}
      </div>

      {/* Enhanced Tabbed Upload Interface */}
      <div className="bg-purple-900/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-700/50 overflow-hidden animate-in zoom-in-95">
        {/* Tab Navigation */}
        <div className="flex border-b border-purple-700/50 bg-purple-950/50">
          <button
            onClick={() => setShowTextInput(false)}
            className={`flex-1 px-8 py-5 font-semibold transition-all duration-300 relative ${
              !showTextInput
                ? 'text-purple-200 bg-purple-900/40'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/20'
            }`}
          >
            {!showTextInput && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
            <div className="flex items-center justify-center gap-3">
              <svg className={`w-6 h-6 transition-transform ${!showTextInput ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-lg">Upload Files</span>
            </div>
          </button>
          <button
            onClick={() => setShowTextInput(true)}
            className={`flex-1 px-8 py-5 font-semibold transition-all duration-300 relative ${
              showTextInput
                ? 'text-pink-200 bg-purple-900/40'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/20'
            }`}
          >
            {showTextInput && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500" />
            )}
            <div className="flex items-center justify-center gap-3">
              <svg className={`w-6 h-6 transition-transform ${showTextInput ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-lg">Write Message</span>
            </div>
          </button>
        </div>

        {/* File Upload Tab */}
        {!showTextInput && (
          <div className="p-10">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`border-3 border-dashed rounded-2xl p-16 text-center transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                isDragging 
                  ? 'border-green-400 bg-green-500/10 scale-105 shadow-2xl shadow-green-500/50' 
                  : 'border-purple-500/50 bg-purple-950/30 hover:border-purple-400 hover:bg-purple-950/40 animate-breathe'
              }`}
              onClick={pickFiles}
            >
              {/* Animated background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
                isDragging 
                  ? 'from-green-600/20 via-emerald-600/20 to-green-600/20 opacity-100'
                  : 'from-purple-600/10 via-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100'
              }`} />
              
              <div className="relative flex flex-col items-center">
                <div className={`w-28 h-28 rounded-2xl flex items-center justify-center mb-8 transition-all shadow-2xl ${
                  isDragging 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 scale-125 animate-bounce shadow-green-500/50' 
                    : 'bg-gradient-to-br from-purple-600 to-pink-600 group-hover:scale-110 shadow-purple-500/50'
                }`}>
                  <svg className="w-14 h-14 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className={`text-3xl font-bold mb-3 transition-colors ${
                  isDragging ? 'text-green-300' : 'text-purple-200'
                }`}>
                  {isDragging ? '✨ Drop files now!' : 'Drop files here'}
                </h3>
                <p className={`mb-8 text-lg transition-colors ${
                  isDragging ? 'text-green-300 font-semibold' : 'text-purple-300'
                }`}>
                  {isDragging ? 'Release to add files to queue' : 'or click to browse your device'}
                </p>
                <div className={`flex items-center gap-2.5 transition-colors ${
                  isDragging ? 'text-green-300' : 'text-purple-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <div className="p-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/50 animate-float">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-pink-200">Write Your Message</h3>
                  <p className="text-purple-300">Create a text file directly in the browser</p>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  placeholder="Type your message here... It will be saved as a .txt file"
                  className="w-full h-80 bg-purple-950/50 backdrop-blur-sm border-2 border-pink-500/30 focus:border-pink-500 hover:border-pink-500/50 rounded-xl px-5 py-4 text-purple-100 placeholder-purple-400 font-mono resize-none transition-all shadow-inner focus:shadow-lg focus:shadow-pink-500/20"
                  autoFocus
                />
                <div className="absolute bottom-4 right-4 text-xs text-purple-400 pointer-events-none">
                  {textMessage.length} characters
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-purple-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your message will be stored as a .txt file
                </div>
                <Button
                  onClick={createTextFile}
                  disabled={!textMessage.trim()}
                  variant="dropout"
                  className="flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Message to Queue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Storage Options Section */}
        <div className="px-10 pb-10 pt-8 border-t border-purple-700/50 bg-purple-950/30">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Section Header */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-200 mb-2">📦 Storage Options</h3>
              <p className="text-purple-300">Choose how your files will be stored on IPFS</p>
            </div>

            {/* Privacy Mode Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Public Option */}
              <button
                onClick={() => {
                  setUsePassword(false);
                  setPassword('');
                }}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
                  !usePassword
                    ? 'border-purple-500 bg-purple-900/40 shadow-lg shadow-purple-500/20 scale-105'
                    : 'border-purple-700/50 bg-purple-950/30 hover:border-purple-600/50 hover:shadow-md hover:bg-purple-900/30'
                }`}
              >
                {!usePassword && (
                  <div className="absolute top-4 right-4 animate-in zoom-in-95">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-purple-100 mb-2 text-lg">🌐 Public Access</h4>
                    <p className="text-sm text-purple-300 leading-relaxed">
                      Files accessible to anyone with the link. Best for sharing public content.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs bg-purple-600/30 text-purple-200 px-2.5 py-1 rounded-full font-medium border border-purple-500/30">Fast</span>
                      <span className="text-xs bg-purple-600/30 text-purple-200 px-2.5 py-1 rounded-full font-medium border border-purple-500/30">Easy Sharing</span>
                      <span className="text-xs bg-purple-600/30 text-purple-200 px-2.5 py-1 rounded-full font-medium border border-purple-500/30">No Password</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Private/Encrypted Option */}
              <button
                onClick={() => setUsePassword(true)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
                  usePassword
                    ? 'border-green-500 bg-green-900/40 shadow-lg shadow-green-500/20 scale-105'
                    : 'border-purple-700/50 bg-purple-950/30 hover:border-green-600/50 hover:shadow-md hover:bg-green-900/20'
                }`}
              >
                {usePassword && (
                  <div className="absolute top-4 right-4 animate-in zoom-in-95">
                    <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/50 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-200 mb-2 text-lg">🔒 Private & Encrypted</h4>
                    <p className="text-sm text-green-300 leading-relaxed">
                      Files encrypted with AES-256. Only password holders can access content.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs bg-green-600/30 text-green-200 px-2.5 py-1 rounded-full font-medium border border-green-500/30">Secure</span>
                      <span className="text-xs bg-green-600/30 text-green-200 px-2.5 py-1 rounded-full font-medium border border-green-500/30">Private</span>
                      <span className="text-xs bg-green-600/30 text-green-200 px-2.5 py-1 rounded-full font-medium border border-green-500/30">AES-256</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Password Input - Animated slide-in */}
            {usePassword && (
              <div className="animate-slideIn">
                <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-xl p-6 border-2 border-green-500/50 shadow-lg shadow-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/50">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <label className="text-lg font-bold text-green-200">Set Encryption Password</label>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password (min. 8 characters)"
                    className="w-full bg-green-950/30 backdrop-blur-sm border-2 border-green-500/50 focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 rounded-lg px-5 py-3.5 text-green-100 placeholder-green-400 transition-all"
                    autoFocus
                  />
                  <div className="mt-4 p-4 bg-amber-900/40 border border-amber-500/50 rounded-lg backdrop-blur-sm">
                    <p className="text-sm text-amber-200 flex items-start gap-3">
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      <span><strong className="text-amber-100">Important:</strong> Save this password securely! There is no way to recover encrypted files without it.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Legacy Raw Storage Option - only show if public */}
          

            {/* Upload Button */}
            <div className="pt-6" data-upload-button>
              <Button 
                onClick={uploadAll} 
                variant="dropout" 
                disabled={uploading || files.length===0 || !walletAddress || (usePassword && !password)}
                className="w-full py-6 text-xl font-bold flex items-center justify-center gap-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 group"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-7 w-7 border-3 border-white border-t-transparent"></div>
                    <span>Uploading {files.length > 0 ? `${files.length} ${files.length === 1 ? 'file' : 'files'}` : ''}...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8" />
                    </svg>
                    <span>
                      {files.length > 0 
                        ? `Sign & Upload ${files.length} ${files.length === 1 ? 'File' : 'Files'}` 
                        : 'Sign & Upload'}
                    </span>
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </Button>
              
              {/* Helper text below button */}
              {files.length > 0 && !uploading && (
                <div className="text-center mt-4 animate-in fade-in">
                  {usePassword && !password && (
                    <p className="text-amber-300 font-medium flex items-center justify-center gap-2 bg-amber-900/20 border border-amber-500/30 rounded-lg px-4 py-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Password required to upload encrypted files
                    </p>
                  )}
                  {!walletAddress && (
                    <p className="text-orange-300 font-medium flex items-center justify-center gap-2 bg-orange-900/20 border border-orange-500/30 rounded-lg px-4 py-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Connect your wallet to sign files
                    </p>
                  )}
                  {walletAddress && (!usePassword || password) && (
                    <p className="text-green-300 font-medium flex items-center justify-center gap-2 bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Ready to upload to IPFS with cryptographic signature
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-8 bg-purple-900/30 backdrop-blur-xl p-6 rounded-2xl border border-purple-700/50 shadow-lg animate-in slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-purple-100 text-lg">Upload Queue</h3>
                <p className="text-sm text-purple-300">{files.length} {files.length === 1 ? 'file' : 'files'} ready</p>
              </div>
            </div>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          </div>
          <div className="space-y-3">
            {files.map((f, i) => (
              <FileCard
                key={i}
                file={f}
                index={i}
                progress={uploadProgress[f.name]}
                uploading={uploading}
                onRemove={() => setFiles(files.filter((_, idx) => idx !== i))}
              />
            ))}
          </div>
        </div>
      )}



      {results.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 p-6 rounded-2xl border-2 border-green-200 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900">Upload Successful! 🎉</h3>
              <p className="text-sm text-green-700">{results.length} {results.length === 1 ? 'file' : 'files'} ready to share</p>
            </div>
          </div>
          <ul className="space-y-3">
            {results.map(r => (
              <li key={r.id} className="group bg-white p-4 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all shadow-sm hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1">{r.name}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          {r.encrypted && (
                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-semibold">🔒 Encrypted</span>
                          )}
                          {r.signature && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold">✓ Signed</span>
                          )}
                          {r.txHash && (
                            <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full font-semibold">⛓️ On-chain</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1">IPFS CID:</div>
                      <code className="text-sm font-mono text-purple-700 break-all">{r.id}</code>
                    </div>
                    {r.signature && (
                      <div className="text-xs text-gray-600">
                        Signature: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.signature.slice(0, 20)}...{r.signature.slice(-10)}</code>
                      </div>
                    )}
                    {r.txHash && (
                      <div className="text-xs text-gray-600 mt-1">
                        Transaction: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.txHash.slice(0, 10)}...{r.txHash.slice(-8)}</code>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        navigator.clipboard.writeText(r.id);
                        toast.success('CID copied!');
                      }}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy CID
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.location.href = `/browse?id=${encodeURIComponent(r.id)}`}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Browse
                    </Button>
                    {!r.id.startsWith('local_') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://ipfs.io/ipfs/${r.id}`, '_blank')}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        IPFS
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200 flex items-center gap-2 flex-wrap text-xs text-gray-600">
                  <button
                    onClick={() => {
                      const shareUrl = !r.id.startsWith('local_') 
                        ? `https://ipfs.io/ipfs/${r.id}`
                        : `${window.location.origin}/browse?id=${encodeURIComponent(r.id)}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast.success('Share link copied!');
                    }}
                    className="flex items-center gap-1 hover:text-purple-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Link
                  </button>
                  {!r.id.startsWith('local_') && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Permanently stored on IPFS
                      </span>
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
