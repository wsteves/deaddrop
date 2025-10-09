import React, { useState, useRef, useEffect } from 'react';
import { defaultStorage } from '../../lib/storage';
import { Button } from '../components/DesignSystem';
import toast from 'react-hot-toast';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { stringToHex } from '@polkadot/util';

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; name: string; signature?: string }>>([]);
  const [walletAddress, setWalletAddress] = useState<string>('');
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
    const res: Array<{ id: string; name: string; signature?: string }> = [];
    
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
          const payload = {
            filename: f.name,
            type: f.type,
            size: f.size,
            data: Array.from(new Uint8Array(array)),
            uploadedBy: walletAddress,
            timestamp: Date.now(),
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
          res.push({ id, name: f.name, signature });
          saveRecent({ id, name: f.name, size: f.size, type: f.type, signature, uploadedBy: walletAddress });
          
          toast.dismiss();
          toast.success(`✓ ${f.name} uploaded & signed`);
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

  function saveRecent(item: { id: string; name: string; size: number; type: string; signature?: string; uploadedBy?: string }) {
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
        <div className="flex items-center justify-center gap-3">
          <input ref={inputRef} type="file" multiple hidden onChange={handleFilesSelected} />
          <Button onClick={pickFiles} variant="primary">Choose files</Button>
          <Button onClick={uploadAll} variant="dropout" disabled={uploading || files.length===0 || !walletAddress}>
            {uploading ? 'Uploading...' : 'Sign & Upload all'}
          </Button>
        </div>
        {!walletAddress && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            💡 Files will be signed with your wallet for authenticity
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
              <li key={r.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {r.name}
                    {r.signature && (
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Signed</span>
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
                </div>
                <a href={`/browse?id=${encodeURIComponent(r.id)}`} className="text-[var(--accent-primary)] font-medium hover:underline ml-4">View</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
