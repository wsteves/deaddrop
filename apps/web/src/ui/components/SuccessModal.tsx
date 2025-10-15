import React from 'react';
import { Button } from './DesignSystem';
import toast from 'react-hot-toast';

interface SuccessModalProps {
  show: boolean;
  onClose: () => void;
  results: Array<{ id: string; name: string; signature?: string; encrypted?: boolean; txHash?: string }>;
  walletAddress: string;
}

export function SuccessModal({ show, onClose, results, walletAddress }: SuccessModalProps) {
  if (!show || results.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl">
          {/* Header with celebration */}
          <div className="relative overflow-hidden p-8 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-green-600/20 border-b border-purple-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-shimmer" />
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50 animate-bounce-in">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-green-300 mb-1">Upload Complete! 🎉</h2>
                <p className="text-purple-200">
                  {results.length} {results.length === 1 ? 'file' : 'files'} successfully uploaded to IPFS
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-purple-300 hover:text-white hover:bg-purple-800/50 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {results.map((r, idx) => (
                <div 
                  key={r.id}
                  className="group relative bg-purple-900/40 backdrop-blur-sm border border-purple-700/50 rounded-xl p-5 hover:border-purple-500/80 hover:bg-purple-900/50 transition-all animate-in slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-purple-100 mb-2 truncate">{r.name}</div>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {r.encrypted && (
                          <span className="text-xs bg-purple-600/30 text-purple-200 px-2.5 py-1 rounded-full font-semibold border border-purple-500/30">
                            🔒 Encrypted
                          </span>
                        )}
                        {r.signature && (
                          <span className="text-xs bg-green-600/30 text-green-200 px-2.5 py-1 rounded-full font-semibold border border-green-500/30">
                            ✓ Signed
                          </span>
                        )}
                        {r.txHash && (
                          <span className="text-xs bg-orange-600/30 text-orange-200 px-2.5 py-1 rounded-full font-semibold border border-orange-500/30">
                            ⛓️ On-chain
                          </span>
                        )}
                      </div>

                      {/* CID */}
                      <div className="bg-purple-950/50 rounded-lg p-3 mb-3 border border-purple-700/30">
                        <div className="text-xs font-semibold text-purple-300 mb-1">IPFS CID:</div>
                        <code className="text-sm font-mono text-green-300 break-all">{r.id}</code>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            navigator.clipboard.writeText(r.id);
                            toast.success('CID copied!');
                          }}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy CID
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.location.href = `/browse?id=${encodeURIComponent(r.id)}`}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View File
                        </Button>
                        {!r.id.startsWith('local_') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${r.id}`, '_blank')}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open IPFS
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-purple-950/50 border-t border-purple-700/50">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-purple-300">
                <span className="font-semibold text-purple-200">Tip:</span> Share the CID with anyone to let them download your files
              </div>
              <Button
                variant="dropout"
                onClick={onClose}
                className="px-6"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
