import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button } from './DesignSystem';
import { connectExtension } from '../../lib/polkadot';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-[var(--border)] shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-1">
            <span className="text-2xl font-bold text-[var(--text-primary)]">Dropout</span>
            {/* <span className="text-2xl font-light text-[var(--text-secondary)]">Jobs</span> */}
          </Link>
          <nav className="hidden md:flex gap-6 items-center text-sm font-medium text-[var(--text-secondary)]">
            <Link to="/" className="hover:text-[var(--accent-primary)] transition-colors">Jobs</Link>
            <Link to="#" className="hover:text-[var(--accent-primary)] transition-colors">Network</Link>
            <Link to="#" className="hover:text-[var(--accent-primary)] transition-colors">Messages</Link>
            <Link to="/new" className="text-[var(--accent-dropout)] hover:text-purple-600 transition-colors">Post Job</Link>
          </nav>
        </div>

        {/* <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Input 
              aria-label="Search jobs" 
              placeholder="Search jobs, companies, skills..." 
              className="rounded-full border-[var(--border)] bg-white pr-20 shadow-sm" 
            />
            <Button 
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 px-4" 
              size="sm"
              variant="primary"
            >
              Search
            </Button>
          </div>
        </div> */}

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex text-[var(--text-secondary)]">
            Sign in
          </Button>
          <ConnectButton />
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
      const accs = await connectExtension('Dropout');
      if (accs && accs.length) {
        const a = accs[0].address;
        localStorage.setItem('walletAddress', a);
        window.dispatchEvent(new CustomEvent('wallet:connected', { detail: { address: a, accounts: accs } }));
        setAddr(a);
      }
    } catch (err: any) {
      alert('Failed to connect: ' + ((err as any)?.message || String(err)));
    }
  }

  return addr ? (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-dropout)] to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
        {addr.slice(0, 2).toUpperCase()}
      </div>
      <Button size="sm" variant="secondary" className="hidden sm:inline-flex">
        {addr.slice(0, 6)}…{addr.slice(-6)}
      </Button>
    </div>
  ) : (
    <Button 
      size="sm" 
      variant="dropout" 
      onClick={handleConnect}
      className="font-semibold shadow-sm"
    >
      Connect Wallet
    </Button>
  );
}
