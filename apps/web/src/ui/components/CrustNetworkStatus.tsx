import React, { useState, useEffect } from 'react';
import { getCrustNetworkStatus, getStorageOrderInfo, type CrustNetworkStatus, type StorageOrderInfo } from '../../lib/storage';

interface CrustNetworkStatusProps {
  cid?: string;
  className?: string;
}

export default function CrustNetworkStatusComponent({ cid, className = '' }: CrustNetworkStatusProps) {
  const [networkStatus, setNetworkStatus] = useState<CrustNetworkStatus | null>(null);
  const [orderInfo, setOrderInfo] = useState<StorageOrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        setLoading(true);
        setError(null);

        // Always fetch network status
        const status = await getCrustNetworkStatus();
        setNetworkStatus(status);

        // If CID provided, fetch storage order info
        if (cid && cid.startsWith('Qm') || cid?.startsWith('bafy')) {
          try {
            const orderInfo = await getStorageOrderInfo(cid);
            setOrderInfo(orderInfo);
          } catch (err) {
            console.warn('Failed to fetch storage order info:', err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Crust Network status');
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, [cid]);

  if (loading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span className="text-red-700 text-sm">Network Error: {error}</span>
        </div>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'success': return 'Active Storage Order';
      case 'pending': return 'Storage Order Pending';
      case 'failed': return 'Storage Order Failed';
      case 'expired': return 'Storage Order Expired';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Network Status */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-blue-900">Crust Network Status</h4>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${networkStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-blue-700">
              {networkStatus?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {networkStatus && (
          <div className="space-y-2 text-sm text-blue-800">
            <div>
              <span className="font-medium">Account:</span>{' '}
              <code className="bg-blue-100 px-1 rounded text-xs">
                {networkStatus.accountAddress.slice(0, 8)}...{networkStatus.accountAddress.slice(-6)}
              </code>
            </div>
            <div>
              <span className="font-medium">Balance:</span> {networkStatus.balance} CRU
            </div>
            <div>
              <span className="font-medium">Network:</span> {networkStatus.network}
            </div>
          </div>
        )}
      </div>

      {/* Storage Order Status (if CID provided) */}
      {cid && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-900">IPFS Storage Status</h4>
            {orderInfo && (
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(orderInfo.orderStatus)}`}></div>
                <span className="text-sm text-green-700">
                  {getStatusText(orderInfo.orderStatus)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-green-800">
            <div>
              <span className="font-medium">Content ID:</span>{' '}
              <code className="bg-green-100 px-1 rounded text-xs">
                {cid.slice(0, 12)}...{cid.slice(-8)}
              </code>
            </div>
            
            {orderInfo && (
              <>
                <div>
                  <span className="font-medium">File Size:</span> {orderInfo.fileSize} bytes
                </div>
                <div>
                  <span className="font-medium">Replicas:</span> {orderInfo.replicaCount}
                </div>
                <div>
                  <span className="font-medium">Storage Cost:</span> {orderInfo.amount}
                </div>
                <div>
                  <span className="font-medium">Expires:</span>{' '}
                  {new Date(orderInfo.expiresAt).toLocaleDateString()}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {orderInfo?.gatewayUrl && (
                <a
                  href={orderInfo.gatewayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  📡 View on Crust Gateway
                </a>
              )}
              
              {/* Public IPFS Links */}
              {cid && (
                <>
                  <a
                    href={`https://ipfs.io/ipfs/${cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                  >
                    🌐 View on IPFS.io
                  </a>
                  <a
                    href={`https://cloudflare-ipfs.com/ipfs/${cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                  >
                    ☁️ View on Cloudflare IPFS
                  </a>
                </>
              )}
              
              {orderInfo?.explorerUrl && (
                <a
                  href={orderInfo.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  🔍 View Storage Order
                </a>
              )}
            </div>
            
            {/* Decentralization Info */}
            {cid && (
              <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-800">
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Truly Decentralized:</span>
                </div>
                <p className="mt-1">Content is accessible from any IPFS gateway worldwide, proving decentralized storage.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* General IPFS Info */}
      {!cid && networkStatus && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Connected to decentralized storage via Crust Network</span>
          </div>
        </div>
      )}
    </div>
  );
}
