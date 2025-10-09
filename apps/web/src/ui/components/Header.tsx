import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './DesignSystem';
import { connectExtension } from '../../lib/polkadot';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-[var(--border)] shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center text-white font-bold">D</div>
            <span className="text-xl font-bold text-[var(--text-primary)]">DripDrop</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center text-sm font-medium text-[var(--text-secondary)]">
            <Link to="/upload" className="hover:text-[var(--accent-primary)] transition-colors">Upload</Link>
            <Link to="/browse" className="hover:text-[var(--accent-primary)] transition-colors">Browse</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton />
          <Link to="/upload">
            <Button variant="dropout" className="font-semibold">Upload file</Button>
          </Link>
          <button className="md:hidden p-2 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">
            ☰
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
      const accs = await connectExtension('DripDrop');
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
        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-dropout)] to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {addr.slice(0, 2).toUpperCase()}
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-sm font-medium">
            {addr.slice(0, 6)}…{addr.slice(-6)}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-[var(--border)] py-2 z-50">
            <div className="px-4 py-2 border-b border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] mb-1">Connected Wallet</div>
              <div className="text-sm font-mono break-all">{addr}</div>
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-hover)] flex items-center gap-2 text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
      className="font-semibold"
    >
      Connect Wallet
    </Button>
  );
}
