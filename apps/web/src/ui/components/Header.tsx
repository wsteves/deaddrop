import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './DesignSystem';
import { connectExtension } from '../../lib/polkadot';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-purple-950/80 backdrop-blur-xl border-b border-purple-800/50 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="group flex items-center space-x-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Dead Drop</span>
          </Link>
          <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
            <Link to="/upload" className="flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-all hover:scale-105 group">
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </Link>
            <Link to="/browse" className="flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-all hover:scale-105 group">
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton />
          <Link to="/upload">
            <Button variant="dropout" className="font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Upload file
            </Button>
          </Link>
          <button className="md:hidden p-2 rounded-lg bg-purple-900/50 text-purple-300 hover:bg-purple-800/50 hover:text-purple-100 transition-all backdrop-blur-sm border border-purple-700/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function ConnectButton() {
  const [addr, setAddr] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  
  useEffect(() => {
    try { 
      setAddr(localStorage.getItem('walletAddress') || ''); 
    } catch {}
    
    function onConnect(e: any) { 
      setAddr(e?.detail?.address || localStorage.getItem('walletAddress') || ''); 
    }
    
    window.addEventListener('wallet:connected', onConnect as any);
    return () => window.removeEventListener('wallet:connected', onConnect as any);
  }, []);

  async function handleConnect() {
    try {
      const accs = await connectExtension('DeadDrop');
      if (accs && accs.length) {
        const a = accs[0].address;
        localStorage.setItem('walletAddress', a);
        window.dispatchEvent(new CustomEvent('wallet:connected', { detail: { address: a, accounts: accs } }));
        setAddr(a);
      }
    } catch (err: any) {
      alert('Failed to connect wallet: ' + ((err as any)?.message || String(err)));
    }
  }

  function handleDisconnect() {
    localStorage.removeItem('walletAddress');
    setAddr('');
    setShowMenu(false);
    window.dispatchEvent(new CustomEvent('wallet:disconnected'));
  }

  return addr ? (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="group flex items-center space-x-2 hover:scale-105 transition-transform"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ring-2 ring-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-700">
            {addr.slice(0, 6)}…{addr.slice(-4)}
          </span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Connected Wallet
              </div>
              <div className="text-xs font-mono text-gray-600 break-all bg-white px-2 py-1.5 rounded-lg border border-purple-100">{addr}</div>
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-red-50 flex items-center gap-2.5 text-red-600 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Disconnect Wallet
            </button>
          </div>
        </>
      )}
    </div>
  ) : (
    <Button 
      size="sm" 
      variant="ghost" 
      onClick={handleConnect}
      className="font-semibold flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
      Connect Wallet
    </Button>
  );
}
