import React, { useEffect, useState } from 'react';
import { ensureExtension, initApi, connectExtension } from '../../lib/polkadot';
import { Button, Card } from '../components/DesignSystem';

export default function Wallet() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    try {
      const addr = localStorage.getItem('walletAddress') || '';
      setSelected(addr);
    } catch {}
  }, []);

  useEffect(() => {
    function onConnect(e: any) {
      const detail = e?.detail;
      if (detail?.accounts) {
        setAccounts(detail.accounts);
        if (detail.address) setSelected(detail.address);
      }
    }
    window.addEventListener('wallet:connected', onConnect as any);
    return () => window.removeEventListener('wallet:connected', onConnect as any);
  }, []);

  async function connect() {
    try {
  const accs = await connectExtension('Polkadot Jobs');
      setAccounts(accs);
      if (accs.length) {
        setSelected(accs[0].address);
        localStorage.setItem('walletAddress', accs[0].address);
        const api = await initApi();
        const bal: any = await api.query.system.account(accs[0].address);
        const free = bal?.data?.free ?? bal?.free ?? '0';
        setBalance(String(free));
      }
    } catch (err:any) { alert('No extension or permission'); }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Wallet</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <p className="mb-4 text-slate-300">Connect your Polkadot extension to manage publishing and signing.</p>
            <Button onClick={connect}>Connect Wallet</Button>
          </Card>

          <Card className="p-6">
            <h3 className="mb-2">Selected Account</h3>
            <div className="mb-2">{selected || 'None'}</div>
            <div className="mb-2">Balance: {balance}</div>
            <div className="flex gap-2 mt-4">
              {accounts.map(a => (
                <Button key={a.address} variant={selected===a.address ? 'primary' : 'ghost'} onClick={() => { setSelected(a.address); localStorage.setItem('walletAddress', a.address); }}>{a.meta.name}</Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
