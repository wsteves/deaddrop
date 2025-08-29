import React from 'react';
import { Link } from 'react-router-dom';
import { Input, Button } from './DesignSystem';
import { connectExtension } from '../../lib/polkadot';
import { useState, useEffect } from 'react';

export default function Header() {
  return (
    <header className="bg-transparent text-white border-b border-slate-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-extrabold text-2xl tracking-tight">
            <span className="text-[var(--accent-from)]">Dropout</span><span className="text-[var(--accent-accent)]">Jobs</span>
          </Link>
          <nav className="hidden md:flex gap-4 items-center text-sm text-slate-200">
            <Link to="/" className="hover:underline">Jobs</Link>
            <Link to="#" className="hover:underline">My Network</Link>
            <Link to="#" className="hover:underline">Messaging</Link>
            <Link to="#" className="hover:underline">Notifications</Link>
            <Link to="/new" className="hover:underline">Post a Job</Link>
          </nav>
        </div>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Input aria-label="Search jobs" placeholder="Search jobs, people, companies..." className="rounded-full" />
            <Button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full" size="sm">Search</Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
          <ConnectButton />
          <button className="md:hidden p-2 rounded bg-slate-800/30">☰</button>
        </div>
      </div>
    </header>
  );
}

    function ConnectButton() {
      const [addr, setAddr] = useState<string>('');
      useEffect(() => {
        try { setAddr(localStorage.getItem('walletAddress') || ''); } catch {}
        function onConnect(e: any) { setAddr(e?.detail?.address || localStorage.getItem('walletAddress') || ''); }
        window.addEventListener('wallet:connected', onConnect as any);
        return () => window.removeEventListener('wallet:connected', onConnect as any);
      }, []);

      async function handleConnect() {
        try {
          const accs = await connectExtension('Dropout Jobs');
          if (accs && accs.length) {
            const a = accs[0].address;
            localStorage.setItem('walletAddress', a);
            window.dispatchEvent(new CustomEvent('wallet:connected', { detail: { address: a, accounts: accs } }));
            setAddr(a);
          }
        } catch (err:any) {
          alert('Failed to connect: ' + ((err as any)?.message || String(err)));
        }
      }

      return addr ? <Button size="sm" variant="secondary">{addr.slice(0,6)}…{addr.slice(-6)}</Button> : <Button size="sm" onClick={handleConnect}>Connect Wallet</Button>;
    }
