import React, { useEffect, useState, useRef } from 'react';
import { defaultStorage } from '../../lib/storage';
import { Button } from '../components/DesignSystem';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { decryptData } from './Upload';

// Helper function to get file type info with icon and color
function getFileTypeInfo(filename: string, mimeType: string) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  
  // Images
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) {
    return { icon: '🖼️', label: 'Image', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-900/40', border: 'border-blue-700/50', text: 'text-blue-300' };
  }
  
  // Videos
  if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) {
    return { icon: '🎬', label: 'Video', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-900/40', border: 'border-purple-700/50', text: 'text-purple-300' };
  }
  
  // Audio
  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) {
    return { icon: '🎵', label: 'Audio', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-900/40', border: 'border-pink-700/50', text: 'text-pink-300' };
  }
  
  // Documents
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
    return { icon: '📄', label: 'Document', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-900/40', border: 'border-orange-700/50', text: 'text-orange-300' };
  }
  
  // Code
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml', 'sql'].includes(ext || '')) {
    return { icon: '💻', label: 'Code', color: 'from-green-500 to-emerald-500', bg: 'bg-green-900/40', border: 'border-green-700/50', text: 'text-green-300' };
  }
  
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return { icon: '📦', label: 'Archive', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-900/40', border: 'border-yellow-700/50', text: 'text-yellow-300' };
  }
  
  // Default
  return { icon: '📁', label: 'File', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-900/40', border: 'border-purple-700/50', text: 'text-purple-300' };
}

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
    <div className="bg-purple-950/30 backdrop-blur-xl p-5 rounded-xl border border-purple-800/50 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-bold text-purple-100">Recent Uploads</h3>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 5).map((it: any, idx: number) => (
          <li key={`${it.id}-${idx}`} className="group animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <button
              onClick={() => onOpen(it.id)}
              className="w-full text-left p-3 rounded-lg border border-purple-800/30 bg-purple-950/20 hover:border-purple-600/50 hover:bg-purple-900/40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-purple-100 truncate group-hover:text-pink-400 transition-colors">
                    {it.name}
                  </div>
                  <div className="text-xs text-purple-400 mt-1">
                    {new Date(it.when).toLocaleDateString()} • {Math.round(it.size / 1024)} KB
                  </div>
                </div>
                <svg className="w-5 h-5 text-purple-500 group-hover:text-pink-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
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
  const [qrGenerated, setQrGenerated] = useState(false);
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
      
      // Process the content based on what we received
      let processedContent = data;
      
      // If data.data is an array of bytes, try to detect if it's actually JSON
      if (data.data && Array.isArray(data.data)) {
        try {
          const text = new TextDecoder().decode(new Uint8Array(data.data));
          
          // Try to parse as JSON to see if it's a wrapped file
          const parsed = JSON.parse(text);
          
          // If it has a 'data' property that's an object with 'data' array, it's a JSON-wrapped file
          if (parsed.data && typeof parsed.data === 'object' && Array.isArray(parsed.data.data)) {
            // Unwrap the content
            processedContent = {
              filename: parsed.data.filename || data.filename || 'file',
              type: parsed.data.type || data.type || 'application/octet-stream',
              size: parsed.data.data.length,
              data: parsed.data.data,
              signature: parsed.signature,
              uploadedBy: parsed.uploadedBy,
              signedMessage: parsed.signedMessage,
              encrypted: parsed.data.encrypted || false,
              isWrapped: true // Flag to indicate we unwrapped it
            };
          } else if (parsed.data && typeof parsed.data === 'object') {
            // Another JSON wrapper format
            processedContent = {
              filename: parsed.data.filename || data.filename || 'file',
              type: parsed.data.type || data.type || 'text/plain',
              size: text.length,
              data: data.data, // Keep original bytes
              signature: parsed.signature,
              uploadedBy: parsed.uploadedBy,
              signedMessage: parsed.signedMessage,
              encrypted: parsed.data.encrypted || false,
              isWrapped: true
            };
          }
          // If JSON parse succeeds but doesn't match our wrapper format, keep as-is
        } catch (e) {
          // Not JSON, keep the raw data as-is
          // This handles plain text files stored without JSON wrapper
        }
      }
      
      setContent(processedContent);
      
      // Generate public link - use IPFS gateway for real CIDs
      const isRealIPFS = cid && !cid.startsWith('local_');
      const publicUrl = isRealIPFS 
        ? `https://ipfs.io/ipfs/${cid}`
        : `${window.location.origin}/browse?id=${encodeURIComponent(cid)}`;
      setQrCodeUrl(publicUrl);
      setQrGenerated(false); // Reset QR generation flag
      
    } catch (err: any) {
      console.error('Retrieve error:', err);
      
      // Better error messages based on the issue
      const isLocalFile = cid && cid.startsWith('local_');
      
      if (isLocalFile) {
        toast.error('File not found - local files are lost when server restarts', {
          icon: '🔄',
          duration: 5000,
          style: {
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            fontWeight: '600',
          },
        });
      } else if (err.message?.includes('timeout') || err.message?.includes('network')) {
        toast.error('Network error - check your connection or try a different gateway', {
          icon: '📡',
          duration: 5000,
        });
      } else if (err.message?.includes('not found') || err.status === 404) {
        toast.error('File not found on IPFS - CID may be invalid', {
          icon: '❌',
          duration: 5000,
        });
      } else {
        toast.error('Failed to retrieve content - ' + (err.message || 'unknown error'), {
          icon: '⚠️',
          duration: 5000,
        });
      }
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
      setQrGenerated(false); // Reset QR generation flag
      
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

  function copyToClipboard(text: string, message = 'Link copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(message, {
        icon: '✨',
        style: {
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(236, 72, 153, 0.95))',
          color: '#fff',
          fontWeight: '600',
        },
      });
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }

  // Generate QR code only when showQR is true
  useEffect(() => {
    if (showQR && qrCodeUrl && canvasRef.current && !qrGenerated) {
      const generateQR = async () => {
        try {
          await QRCode.toCanvas(canvasRef.current, qrCodeUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#7c3aed',
              light: '#ffffff'
            }
          });
          setQrGenerated(true);
        } catch (err) {
          console.error('QR generation failed:', err);
        }
      };
      generateQR();
    }
  }, [showQR, qrCodeUrl, qrGenerated]);

  function downloadQR() {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `dripdrop-qr-${id.slice(0, 8)}.png`;
      a.click();
    }
  }
  
  function toggleQR() {
    setShowQR(!showQR);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Enhanced Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg animate-float">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-5xl font-bold text-purple-100">
              Browse Files
            </h1>
            <p className="text-purple-300 text-sm mt-1">Retrieve and view files from IPFS</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Enhanced Search Card */}
          <div className="bg-purple-950/30 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-purple-800/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <h3 className="font-semibold text-purple-100">Enter File ID or IPFS CID</h3>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input 
                  className="w-full bg-purple-950/30 backdrop-blur-md border-2 border-purple-800/50 focus:border-purple-500 rounded-lg px-4 py-3 pr-10 font-mono text-sm transition-all text-purple-100 placeholder-purple-500/50" 
                  placeholder="Qm... or local ID" 
                  value={id} 
                  onChange={e => setId(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && openId()}
                />
                {id && (
                  <button 
                    onClick={() => setId('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  </button>
                )}
              </div>
              <Button 
                onClick={() => openId()} 
                variant="primary"
                className="px-6 flex items-center gap-2 shadow-lg hover:shadow-pink-500/50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Retrieve
              </Button>
            </div>
            
            {/* Password Decrypt UI */}
            {needsPassword && (
              <div className="mt-4 p-4 bg-green-900/40 backdrop-blur-md border-2 border-green-700/50 rounded-lg shadow-lg animate-bounce-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-md animate-glow-pulse">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-100">🔒 This file is encrypted</h4>
                    <p className="text-xs text-green-300">AES-256-GCM encryption</p>
                  </div>
                </div>
                <div className="bg-green-950/40 backdrop-blur-sm border border-green-800/50 rounded p-2 mb-3">
                  <p className="text-xs text-green-200">
                    ⚠️ <strong>Privacy Protected:</strong> This file is stored encrypted on IPFS. Only people with the password can decrypt and view the contents.
                  </p>
                </div>
                <p className="text-sm text-green-200 mb-3 font-medium">Enter the password to decrypt and view this file</p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && decryptFile()}
                      placeholder="Enter password"
                      className="w-full bg-green-950/30 backdrop-blur-md border-2 border-green-700/50 focus:border-green-500 rounded-lg px-4 py-2 pr-10 text-sm transition-all text-green-100 placeholder-green-500/50"
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <Button onClick={decryptFile} variant="primary" className="px-6 flex items-center gap-2 shadow-lg hover:shadow-green-500/50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Decrypt
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6">
              {/* Enhanced Empty State */}
              {!loading && !content && !needsPassword && (
                <div className="bg-purple-950/20 backdrop-blur-md rounded-xl p-12 border border-purple-800/30 text-center animate-slide-up">
                  <div className="mb-6 relative">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center animate-float">
                      <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-20 h-20 bg-pink-500/10 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-purple-100 mb-3">Ready to Browse</h3>
                  <p className="text-purple-300 mb-6 max-w-md mx-auto">
                    Enter an IPFS CID or local file ID above to retrieve and view your decentralized files
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center text-sm">
                    <span className="px-3 py-1.5 bg-purple-900/40 text-purple-200 rounded-lg border border-purple-700/50">
                      🔍 Search by CID
                    </span>
                    <span className="px-3 py-1.5 bg-purple-900/40 text-purple-200 rounded-lg border border-purple-700/50">
                      🔐 Decrypt Protected Files
                    </span>
                    <span className="px-3 py-1.5 bg-purple-900/40 text-purple-200 rounded-lg border border-purple-700/50">
                      📱 Generate QR Codes
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced Loading State with Skeleton */}
              {loading && (
                <div className="space-y-4 animate-slide-up">
                  {/* Skeleton for share section */}
                  <div className="bg-purple-950/40 backdrop-blur-xl p-5 rounded-xl border border-purple-800/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-900/50 rounded-lg animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-purple-900/50 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-purple-900/30 rounded w-48 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-12 bg-purple-900/30 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* Skeleton for file info */}
                  <div className="bg-purple-950/40 backdrop-blur-xl p-5 rounded-xl border border-purple-800/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-900/50 rounded-lg animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-purple-900/50 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-purple-900/30 rounded w-64 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-purple-900/30 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-purple-900/30 rounded w-3/4 animate-pulse"></div>
                      <div className="h-32 bg-purple-900/20 rounded-xl animate-pulse mt-4"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 py-8 text-purple-300">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent shadow-lg"></div>
                      <div className="absolute inset-0 animate-ping rounded-full border-2 border-purple-500 opacity-20"></div>
                    </div>
                    <span className="font-medium">Retrieving file from IPFS...</span>
                  </div>
                </div>
              )}
              {content && (
                <div className="space-y-4 animate-slide-up">
                  {/* Enhanced Public Link & QR Code Section */}
                  <div className="bg-purple-950/40 backdrop-blur-xl p-5 rounded-xl border border-purple-800/50 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md animate-float">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-purple-100">Share This File</h4>
                            <p className="text-xs text-purple-400">Copy link or scan QR code</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input 
                              readOnly 
                              value={qrCodeUrl} 
                              className="w-full text-sm bg-purple-950/30 backdrop-blur-md border-2 border-purple-700/50 rounded-lg px-4 py-3 pr-12 font-mono text-purple-200 shadow-sm"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <Button 
                            size="sm" 
                            variant="primary" 
                            onClick={() => copyToClipboard(qrCodeUrl, '✨ Link copied!')}
                            className="group whitespace-nowrap px-4 py-3 flex items-center gap-2 shadow-lg hover:shadow-pink-500/50 transition-all hover:scale-105"
                          >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={toggleQR}
                            className="whitespace-nowrap px-4 py-3 flex items-center gap-2 hover:bg-purple-900/40 transition-colors text-purple-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            {showQR ? 'Hide QR' : 'Show QR'}
                          </Button>
                        </div>

                        {/* Enhanced IPFS Gateway Links */}
                        {id && !id.startsWith('local_') && (
                          <div className="mt-4 pt-4 border-t border-purple-800/30">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-xs font-bold text-purple-200 uppercase tracking-wide">IPFS Gateways</span>
                            </div>
                            <div className="space-y-2">
                              {/* Primary Gateway - ipfs.io */}
                              <div className="bg-purple-950/30 backdrop-blur-md rounded-lg p-2 border border-purple-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-purple-300">Primary:</span>
                                  <span className="text-xs text-purple-400">ipfs.io</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input 
                                    readOnly 
                                    value={`https://ipfs.io/ipfs/${id}`}
                                    className="flex-1 text-xs bg-purple-950/40 border border-purple-800/50 rounded px-2 py-1.5 font-mono text-purple-200"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                  />
                                  <button
                                    onClick={() => copyToClipboard(`https://ipfs.io/ipfs/${id}`, '✨ Gateway link copied!')}
                                    className="p-1.5 hover:bg-purple-900/40 rounded transition-all hover:scale-110 active:scale-95"
                                    title="Copy link"
                                  >
                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => window.open(`https://ipfs.io/ipfs/${id}`, '_blank')}
                                    className="p-1.5 hover:bg-purple-900/40 rounded transition-colors"
                                    title="Open in new tab"
                                  >
                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              {/* Alternative Gateways */}
                              <details className="group">
                                <summary className="cursor-pointer text-xs font-medium text-purple-400 hover:text-purple-200 flex items-center gap-2 py-2">
                                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                                  </svg>
                                  Alternative Gateways
                                </summary>
                                <div className="mt-2 space-y-2 pl-6">
                                  {[
                                    { name: 'Cloudflare IPFS', url: `https://cloudflare-ipfs.com/ipfs/${id}`, icon: '☁️' },
                                    { name: 'dweb.link', url: `https://dweb.link/ipfs/${id}`, icon: '🌐' },
                                    { name: 'ipfs.eth.aragon', url: `https://ipfs.eth.aragon.network/ipfs/${id}`, icon: '🔷' }
                                  ].map((gateway, i) => (
                                    <div key={i} className="bg-purple-950/30 backdrop-blur-md rounded p-2 border border-purple-800/30 flex items-center gap-2">
                                      <span className="text-sm">{gateway.icon}</span>
                                      <span className="text-xs font-medium text-purple-300 flex-1">{gateway.name}</span>
                                      <button
                                        onClick={() => copyToClipboard(gateway.url, `${gateway.icon} ${gateway.name} link copied!`)}
                                        className="p-1 hover:bg-purple-900/40 rounded transition-all hover:scale-110 active:scale-95"
                                        title="Copy"
                                      >
                                        <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => window.open(gateway.url, '_blank')}
                                        className="p-1 hover:bg-purple-900/40 rounded transition-colors"
                                        title="Open"
                                      >
                                        <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced QR Code Display */}
                    {showQR && (
                      <div className="mt-4 bg-purple-950/50 backdrop-blur-xl rounded-xl p-6 border border-purple-700/50 shadow-lg animate-bounce-in">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <h4 className="font-bold text-purple-100">Scan QR Code</h4>
                          </div>
                          <p className="text-xs text-purple-300 mb-4 text-center">Scan with your phone to quickly access this file</p>
                          
                          <div className="bg-white p-4 rounded-xl border-2 border-purple-600/50 relative shadow-lg">
                            {!qrGenerated && (
                              <div className="absolute inset-0 flex items-center justify-center bg-purple-950/80 backdrop-blur-sm rounded-xl">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-400 border-t-transparent shadow-lg"></div>
                                  <span className="text-sm text-purple-200 font-medium">Generating QR...</span>
                                </div>
                              </div>
                            )}
                            <canvas ref={canvasRef} className="rounded-lg" />
                          </div>
                          
                          <div className="flex gap-3 mt-4">
                            <Button 
                              size="sm" 
                              variant="primary" 
                              onClick={downloadQR}
                              className="flex items-center gap-2 shadow-lg hover:shadow-pink-500/50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download QR
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setShowQR(false)}
                              className="flex items-center gap-2 text-purple-200 hover:bg-purple-900/40"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced File Info Section */}
                  <div className="bg-purple-950/40 backdrop-blur-xl p-5 rounded-xl border border-purple-800/50 shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {(() => {
                            const fileType = getFileTypeInfo(content.filename || '', content.type || '');
                            return (
                              <div className={`w-12 h-12 bg-gradient-to-br ${fileType.color} rounded-lg flex items-center justify-center shadow-md animate-float`}>
                                <span className="text-2xl">{fileType.icon}</span>
                              </div>
                            );
                          })()}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-lg text-purple-100">{content.filename || 'Untitled'}</h3>
                              {(() => {
                                const fileType = getFileTypeInfo(content.filename || '', content.type || '');
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 ${fileType.bg} ${fileType.text} text-xs font-bold rounded-full shadow-sm border ${fileType.border}`}>
                                    {fileType.icon} {fileType.label}
                                  </span>
                                );
                              })()}
                              {content.encrypted && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/40 text-green-300 text-xs font-bold rounded-full shadow-sm border border-green-700/50 animate-glow-pulse">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                                  </svg>
                                  Decrypted
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-purple-300">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {content.type || 'unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                {content.size ? Math.round(content.size/1024) + ' KB' : 'Unknown size'}
                              </span>
                              {content.encrypted && (
                                <span className="flex items-center gap-1 text-green-400 font-medium">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  AES-256 Encrypted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {content.uploadedBy && (
                          <div className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Uploaded by: <code className="text-xs text-pink-400">{content.uploadedBy.slice(0, 8)}...{content.uploadedBy.slice(-6)}</code>
                          </div>
                        )}
                        {content.signature && (
                          <div className="mt-3 p-3 bg-green-900/30 backdrop-blur-md border border-green-700/50 rounded-lg">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  <span className="font-semibold text-green-200 text-sm">Cryptographically Signed</span>
                                </div>
                                <div className="text-xs text-green-300 mb-2">
                                  <div className="font-medium">Signature:</div>
                                  <code className="text-xs bg-green-950/30 px-2 py-1 rounded border border-green-800/50 break-all text-green-200">
                                    {content.signature}
                                  </code>
                                </div>
                                {content.signedMessage && (
                                  <div className="text-xs text-green-300">
                                    <div className="font-medium">Signed Message:</div>
                                    <code className="text-xs bg-green-950/30 px-2 py-1 rounded border border-green-800/50 break-all text-green-200">
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
                                  className="whitespace-nowrap text-xs text-green-300 hover:bg-green-900/30"
                                >
                                  🔍 View on Subscan
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          downloadAsFile(content);
                          toast.success('Download started!', {
                            icon: '⬇️',
                            style: {
                              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(236, 72, 153, 0.95))',
                              color: '#fff',
                              fontWeight: '600',
                            },
                          });
                        }}
                        className="group flex items-center gap-2 shadow-lg hover:shadow-pink-500/50 transition-all hover:scale-105"
                      >
                        <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </Button>
                    </div>

                    {/* IPFS Storage Info */}
                    {/* {id && !id.startsWith('local_') && (
                      <div className="mt-4 p-3 bg-blue-900/30 backdrop-blur-md border border-blue-700/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex-1 text-xs text-blue-200">
                            <p className="font-semibold mb-1">📦 IPFS Storage Format</p>
                            <p className="mb-2">
                              Files on IPFS are stored with metadata (signature, timestamp, encryption status). 
                              The raw IPFS link shows the JSON wrapper.
                            </p>
                            <p className="font-medium">
                              💡 <strong>Tip:</strong> Use DripDrop to view files properly, or download to get the raw file content.
                            </p>
                          </div>
                        </div>
                      </div>
                    )} */}

                    {/* Enhanced Preview Section */}
                    <div className="mt-5 pt-5 border-t border-purple-800/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <h4 className="font-bold text-purple-100">File Preview</h4>
                          {content.isWrapped && (
                            <span className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-300 font-semibold rounded-full border border-blue-700/50">
                              📦 Unwrapped
                            </span>
                          )}
                        </div>
                        {content.type && (content.type.startsWith('text/') || content.type === 'application/octet-stream') && (
                          <button
                            onClick={() => {
                              const text = new TextDecoder().decode(new Uint8Array(content.data || []));
                              const blob = new Blob([text], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            }}
                            className="text-xs px-3 py-1 bg-purple-900/40 text-purple-200 rounded-lg hover:bg-purple-800/60 transition-colors flex items-center gap-1 border border-purple-700/50"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open Raw Text
                          </button>
                        )}
                      </div>
                      {(() => {
                        // Smart preview based on content type and data
                        if (!content.data || !Array.isArray(content.data)) {
                          return (
                            <div className="bg-purple-950/20 text-purple-400 p-4 rounded-xl text-sm text-center border border-purple-800/30">
                              No preview available
                            </div>
                          );
                        }

                        // Image preview
                        if (content.type && content.type.startsWith('image/')) {
                          return (
                            <div className="bg-purple-950/30 backdrop-blur-md p-4 rounded-xl border border-purple-800/50">
                              <img 
                                src={URL.createObjectURL(new Blob([new Uint8Array(content.data)]))} 
                                alt="preview" 
                                className="max-w-full rounded-lg shadow-lg mx-auto" 
                              />
                            </div>
                          );
                        }

                        // Text preview
                        try {
                          const text = new TextDecoder().decode(new Uint8Array(content.data));
                          
                          // Check if it looks like text (not binary garbage)
                          const isPrintable = text.split('').every(char => {
                            const code = char.charCodeAt(0);
                            return code === 10 || code === 13 || code === 9 || (code >= 32 && code < 127) || code > 127;
                          });

                          if (isPrintable && text.trim().length > 0) {
                            // Check if it's HTML content
                            const isHtml = content.type === 'text/html' || 
                              content.filename?.endsWith('.html') || 
                              content.filename?.endsWith('.htm') ||
                              text.trim().startsWith('<!DOCTYPE') ||
                              text.trim().startsWith('<html');

                            if (isHtml) {
                              // Fix missing library dependencies
                              let fixedHtml = text;
                              
                              // Check if THREE.js is used but not imported
                              const usesTHREE = fixedHtml.includes('THREE.') || fixedHtml.includes('new THREE') || fixedHtml.match(/THREE\s*\./);
                              const hasTHREEImport = fixedHtml.includes('three.js') || fixedHtml.includes('three.min.js') || fixedHtml.includes('three.module.js');
                              
                              if (usesTHREE && !hasTHREEImport) {
                                // Inject THREE.js CDN before closing head tag or at start of body
                                const threeScript = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
                                
                                if (fixedHtml.includes('</head>')) {
                                  fixedHtml = fixedHtml.replace('</head>', `${threeScript}\n</head>`);
                                } else if (fixedHtml.includes('<body>')) {
                                  fixedHtml = fixedHtml.replace('<body>', `<body>\n${threeScript}`);
                                } else {
                                  // No head or body tags, prepend to content
                                  fixedHtml = threeScript + '\n' + fixedHtml;
                                }
                              }
                              
                              // Create a blob URL for the HTML
                              const blob = new Blob([fixedHtml], { type: 'text/html' });
                              const htmlUrl = URL.createObjectURL(blob);

                              return (
                                <div className="space-y-4">
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-orange-900/40 text-orange-300 font-semibold rounded-full border border-orange-700/50">
                                      🌐 HTML Document
                                    </span>
                                  </div>

                                  {/* HTML Rendered Preview */}
                                  <div className="bg-purple-950/20 backdrop-blur-md p-4 rounded-xl border border-purple-800/50 shadow-inner">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-semibold text-purple-100 text-sm">Live Preview</h5>
                                      <button
                                        onClick={() => window.open(htmlUrl, '_blank')}
                                        className="text-xs px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-md"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Open Full Page
                                      </button>
                                    </div>
                                    
                                    {/* Warning for external dependencies */}
                                    {(text.includes('cdn.') || text.includes('unpkg.') || text.includes('jsdelivr') || text.includes('THREE')) && (
                                      <div className="mb-3 p-2 bg-yellow-900/30 backdrop-blur-md border border-yellow-700/50 rounded-lg flex items-start gap-2">
                                        <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                        </svg>
                                        <p className="text-xs text-yellow-200">
                                          <strong>Note:</strong> This HTML uses external libraries. If it doesn't work in preview, click "Open Full Page" for best results.
                                        </p>
                                      </div>
                                    )}

                                    <iframe 
                                      src={htmlUrl}
                                      className="w-full border-2 border-purple-700/50 rounded-lg bg-white"
                                      style={{ height: '600px' }}
                                      title="HTML Preview"
                                      allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
                                    />
                                  </div>

                                  {/* HTML Source Code */}
                                  <details className="group">
                                    <summary className="cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-200 flex items-center gap-2 py-2">
                                      <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                                      </svg>
                                      View HTML Source Code
                                    </summary>
                                    <div className="mt-2">
                                      <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs overflow-auto max-h-96 shadow-inner border border-purple-800/50 whitespace-pre-wrap break-words">
                                        {text}
                                      </div>
                                    </div>
                                  </details>
                                </div>
                              );
                            }

                            // Try to detect if it's JSON for pretty printing
                            let displayText = text;
                            let isJson = false;
                            try {
                              const parsed = JSON.parse(text);
                              displayText = JSON.stringify(parsed, null, 2);
                              isJson = true;
                            } catch {
                              // Not JSON, use as-is
                            }

                            return (
                              <div>
                                {isJson && (
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-yellow-900/40 text-yellow-300 font-semibold rounded-full border border-yellow-700/50">
                                      📄 JSON Format
                                    </span>
                                  </div>
                                )}
                                <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm overflow-auto max-h-96 shadow-inner border border-purple-800/50 whitespace-pre-wrap break-words">
                                  {displayText}
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error('Text decode error:', e);
                        }

                        // Binary/Unknown preview - show metadata
                        return (
                          <div className="bg-purple-950/20 backdrop-blur-md p-4 rounded-xl border border-purple-800/50">
                            <div className="text-center text-purple-300 mb-3">
                              <svg className="w-12 h-12 mx-auto mb-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="font-semibold">Binary file - No preview available</p>
                              <p className="text-xs mt-1">Download to view content</p>
                            </div>
                            <div className="bg-purple-950/40 backdrop-blur-md p-3 rounded-lg text-xs font-mono border border-purple-800/30">
                              <div className="text-purple-200">
                                <strong>File Info:</strong>
                              </div>
                              <div className="mt-2 space-y-1 text-purple-400">
                                <div>• Name: {content.filename}</div>
                                <div>• Type: {content.type}</div>
                                <div>• Size: {content.size ? Math.round(content.size/1024) + ' KB' : 'Unknown'}</div>
                                <div>• Bytes: {content.data.length}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips Card */}
          <div className="bg-purple-950/40 backdrop-blur-xl p-5 rounded-xl border border-purple-800/50 shadow-lg animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 text-purple-400 animate-glow-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-bold text-purple-100">Quick Tips</h3>
            </div>
            <ul className="space-y-2 text-sm text-purple-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">💡</span>
                <span>Enter any IPFS CID (starting with Qm...)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">🔒</span>
                <span>Encrypted files require the password</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">📱</span>
                <span>Use QR codes for quick mobile access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">🌐</span>
                <span>Multiple IPFS gateways for reliability</span>
              </li>
            </ul>
          </div>

          {/* Recent Files */}
          <RecentList onOpen={(i) => { setId(i); openId(i); }} />
        </div>
      </div>
    </div>
  );
}
