import React, { useEffect, useState, useRef } from 'react';
import { defaultStorage } from '../../lib/storage';
import { Button } from '../components/DesignSystem';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { decryptData } from './Upload';

function RecentList({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems] = useState<Array<any>>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dripdrop:recent') || '[]';
      setItems(JSON.parse(raw));
    } catch { setItems([]); }
  }, []);

  if (!items.length) return null;
  return (
    <div className="bg-white p-4 rounded-lg">
      <h3 className="font-medium">Recent uploads</h3>
      <ul className="mt-2 space-y-2">
        {items.map((it: any) => (
          <li key={it.id} className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-sm text-[var(--text-secondary)]">{new Date(it.when).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => onOpen(it.id)}>Open</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Browse() {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [encryptedData, setEncryptedData] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check for ID in URL params
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    if (urlId) {
      setId(urlId);
      openId(urlId);
    }
  }, []);

  async function openId(value?: string) {
    const cid = value ?? id;
    if (!cid) return toast.error('Enter an ID');
    setLoading(true);
    setContent(null);
    setQrCodeUrl('');
    setNeedsPassword(false);
    try {
      const data = await defaultStorage.retrieve(cid);
      
      // Check if encrypted
      if (data.encrypted) {
        setEncryptedData(data);
        setNeedsPassword(true);
        setLoading(false);
        return;
      }
      
      setContent(data);
      
      // Generate public link - use IPFS gateway for real CIDs
      const isRealIPFS = cid && !cid.startsWith('local_');
      const publicUrl = isRealIPFS 
        ? `https://ipfs.io/ipfs/${cid}`
        : `${window.location.origin}/browse?id=${encodeURIComponent(cid)}`;
      setQrCodeUrl(publicUrl);
      
      // Generate QR code
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, publicUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#7c3aed',
            light: '#ffffff'
          }
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to retrieve content');
    } finally { setLoading(false); }
  }

  async function decryptFile() {
    if (!password) return toast.error('Please enter password');
    if (!encryptedData) return;

    try {
      toast.loading('Decrypting...');
      const encryptedBytes = new Uint8Array(encryptedData.data);
      const decrypted = await decryptData(encryptedBytes, password);
      
      // Update content with decrypted data
      const decryptedContent = {
        ...encryptedData,
        data: Array.from(decrypted),
        encrypted: false,
      };
      
      setContent(decryptedContent);
      setNeedsPassword(false);
      setPassword('');
      
      // Generate public link - use IPFS gateway for real CIDs
      const isRealIPFS = id && !id.startsWith('local_');
      const publicUrl = isRealIPFS 
        ? `https://ipfs.io/ipfs/${id}`
        : `${window.location.origin}/browse?id=${encodeURIComponent(id)}`;
      setQrCodeUrl(publicUrl);
      
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, publicUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#7c3aed',
            light: '#ffffff'
          }
        });
      }
      
      toast.dismiss();
      toast.success('File decrypted successfully!');
    } catch (err: any) {
      toast.dismiss();
      console.error(err);
      toast.error('Decryption failed - wrong password?');
    }
  }

  function downloadAsFile(obj: any) {
    try {
      const arr = new Uint8Array(obj.data || []);
      const blob = new Blob([arr], { type: obj.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = obj.filename || 'file';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }

  function downloadQR() {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `dripdrop-qr-${id.slice(0, 8)}.png`;
      a.click();
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Browse DripDrop</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex gap-3">
              <input className="flex-1 border rounded px-3 py-2" placeholder="Enter ID / CID" value={id} onChange={e => setId(e.target.value)} />
              <Button onClick={() => openId()} variant="primary">Open</Button>
            </div>
            
            {/* Password Decrypt UI */}
            {needsPassword && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h4 className="font-semibold text-purple-900">This file is encrypted</h4>
                </div>
                <p className="text-sm text-purple-700 mb-3">Enter the password to decrypt and view this file</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && decryptFile()}
                    placeholder="Enter password"
                    className="flex-1 border border-purple-300 rounded px-3 py-2 text-sm"
                  />
                  <Button onClick={decryptFile} variant="primary">🔓 Decrypt</Button>
                </div>
              </div>
            )}

            <div className="mt-4">
              {loading && <div className="text-[var(--text-secondary)]">Loading…</div>}
              {content && (
                <div className="space-y-4">
                  {/* Public Link & QR Code Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-900 mb-1 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Public Share Link
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            readOnly 
                            value={qrCodeUrl} 
                            className="flex-1 text-sm bg-white border border-purple-300 rounded px-3 py-2 font-mono text-purple-700"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                          <Button 
                            size="sm" 
                            variant="primary" 
                            onClick={() => copyToClipboard(qrCodeUrl)}
                            className="whitespace-nowrap"
                          >
                            📋 Copy
                          </Button>
                        </div>

                        {/* IPFS Gateway Link */}
                        {id && !id.startsWith('local_') && (
                          <div className="mt-3">
                            <div className="text-xs text-purple-700 font-medium mb-1">📦 IPFS Gateway Links:</div>
                            <div className="space-y-2">
                              {/* Primary Gateway - ipfs.io */}
                              <div className="flex items-center gap-2">
                                <input 
                                  readOnly 
                                  value={`https://ipfs.io/ipfs/${id}`}
                                  className="flex-1 text-xs bg-white border border-purple-300 rounded px-2 py-1.5 font-mono text-purple-700"
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => copyToClipboard(`https://ipfs.io/ipfs/${id}`)}
                                  title="Copy IPFS.io link"
                                >
                                  📋
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => window.open(`https://ipfs.io/ipfs/${id}`, '_blank')}
                                  title="Open in IPFS.io"
                                >
                                  🔗
                                </Button>
                              </div>
                              {/* Alternative Gateways */}
                              <details className="text-xs">
                                <summary className="cursor-pointer text-purple-600 hover:text-purple-800">More gateways...</summary>
                                <div className="mt-2 space-y-1 pl-4">
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={`https://cloudflare-ipfs.com/ipfs/${id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-xs"
                                    >
                                      Cloudflare Gateway
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={`https://dweb.link/ipfs/${id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-xs"
                                    >
                                      dweb.link Gateway
                                    </a>
                                  </div>
                                </div>
                              </details>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setShowQR(!showQR)}
                        className="ml-2"
                      >
                        {showQR ? '🔼' : '🔽'} QR
                      </Button>
                    </div>

                    {showQR && (
                      <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-purple-200">
                        <div className="text-sm text-purple-700 mb-2">Scan to access file</div>
                        <canvas ref={canvasRef} className="mb-3" />
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={downloadQR}>
                            💾 Download QR
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Info Section */}
                  <div className="bg-[var(--surface)] p-4 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{content.filename || 'Untitled'}</div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">
                          {content.type || 'unknown'} • {content.size ? Math.round(content.size/1024) + ' KB' : ''}
                        </div>
                        {content.uploadedBy && (
                          <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Uploaded by: <code className="text-xs">{content.uploadedBy.slice(0, 8)}...{content.uploadedBy.slice(-6)}</code>
                          </div>
                        )}
                        {content.signature && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  <span className="font-semibold text-green-900 text-sm">Cryptographically Signed</span>
                                </div>
                                <div className="text-xs text-green-700 mb-2">
                                  <div className="font-medium">Signature:</div>
                                  <code className="text-xs bg-white px-2 py-1 rounded border border-green-200 break-all">
                                    {content.signature}
                                  </code>
                                </div>
                                {content.signedMessage && (
                                  <div className="text-xs text-green-700">
                                    <div className="font-medium">Signed Message:</div>
                                    <code className="text-xs bg-white px-2 py-1 rounded border border-green-200 break-all">
                                      {content.signedMessage}
                                    </code>
                                  </div>
                                )}
                              </div>
                              {content.uploadedBy && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(`https://westend.subscan.io/account/${content.uploadedBy}`, '_blank')}
                                  title="View signer on Subscan"
                                  className="whitespace-nowrap text-xs"
                                >
                                  🔍 View on Subscan
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => downloadAsFile(content)}>
                          💾 Download
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      {content.type && content.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(new Blob([new Uint8Array(content.data)]))} alt="preview" className="max-w-full rounded" />
                      ) : (
                        <pre className="text-sm overflow-auto max-h-96 p-2 bg-white rounded">{content && content.type && content.type.startsWith('text/') ? new TextDecoder().decode(new Uint8Array(content.data || [])) : JSON.stringify({ filename: content.filename, type: content.type }, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <RecentList onOpen={(i) => { setId(i); openId(i); }} />
        </div>
      </div>
    </div>
  );
}
