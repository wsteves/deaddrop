import React from 'react';

interface FileCardProps {
  file: File;
  index: number;
  progress?: number;
  uploading: boolean;
  onRemove: () => void;
}

export function FileCard({ file, index, progress, uploading, onRemove }: FileCardProps) {
  const isUploading = uploading && progress !== undefined && progress >= 0 && progress < 100;
  const isComplete = progress === 100;
  const isError = progress === -1;
  
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('text')) return '📝';
    if (file.type.includes('zip') || file.type.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <div 
      className="group relative animate-in slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative bg-purple-900/30 backdrop-blur-sm border border-purple-700/50 rounded-xl p-4 hover:border-purple-500/80 hover:bg-purple-900/40 transition-all duration-300">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-pink-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:via-pink-600/10 group-hover:to-purple-600/10 rounded-xl transition-all duration-500" />
        
        <div className="relative flex items-center gap-4">
          {/* File Icon/Status */}
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl transition-all duration-300
            ${isComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50' : 
              isError ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/50' :
              isUploading ? 'bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse' :
              'bg-gradient-to-br from-purple-600 to-pink-600 group-hover:scale-110 shadow-lg shadow-purple-500/50'}
          `}>
            {isComplete ? (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : isError ? (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <span>{getFileIcon()}</span>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-semibold text-purple-100 truncate">{file.name}</div>
              {isComplete && (
                <span className="inline-flex items-center px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-bold rounded-full border border-green-500/30">
                  ✓ Done
                </span>
              )}
              {isError && (
                <span className="inline-flex items-center px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                  ✗ Failed
                </span>
              )}
            </div>
            <div className="text-sm text-purple-300 flex items-center gap-2">
              <span>{(file.size / 1024).toFixed(1)} KB</span>
              <span className="opacity-50">•</span>
              <span className="truncate">{file.type || 'unknown'}</span>
              {isUploading && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="text-purple-200 font-medium">{progress}%</span>
                </>
              )}
            </div>
            
            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-3 w-full bg-purple-950/50 rounded-full h-2 overflow-hidden border border-purple-700/30">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              </div>
            )}
          </div>

          {/* Remove Button */}
          {!isUploading && !isComplete && (
            <button
              onClick={onRemove}
              className="p-2 text-purple-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Remove"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
