import { useEffect, useState } from 'react';
import { fetchListings, fetchOnchainListingById, type Listing } from '../../lib/api';
import ListingCard from '../components/ListingCard';

export default function Home() {
  const [items, setItems] = useState<Listing[]>([]);
  const [onchainItems, setOnchainItems] = useState<Listing[]>([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'local'|'onchain'>('local');
  useEffect(() => {
    if (tab === 'onchain') {
      fetchListings().then(localListings => {
        const published = localListings.filter(l => l.blockHash && l.commitHash);
        Promise.all(published.map(l =>
          fetchOnchainListingById(l.id).then(r => r.listing).catch(() => null)
        )).then(results => {
          setOnchainItems(results.filter(Boolean));
        });
      });
    } else {
      fetchListings({ q }).then(setItems);
    }
  }, [q, tab]);

  let tabContent;
  if (tab === 'local') {
    tabContent = (
      <div>
        <div className="mb-2 text-sm text-gray-600">These are your saved ads. Publish to chain to make them live.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(l => <ListingCard key={l.id} l={l} showPublish />)}
          {!items.length && <div className="text-gray-500">No saved ads yet.</div>}
        </div>
      </div>
    );
  } else {
    tabContent = (
      <div>
        <div className="mb-2 text-sm text-green-700">These are live ads published on-chain (Westend).</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onchainItems.map(l => <ListingCard key={l.id} l={l} />)}
          {!onchainItems.length && <div className="text-gray-500">No live ads found on-chain.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between py-6 px-4 bg-white shadow rounded-xl mb-6">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 text-2xl font-bold">🛒</span>
          <span className="text-2xl font-bold text-gray-800">Polka Kleinanzeigen</span>
        </div>
        <nav className="flex gap-4">
          <a href="/" className="text-gray-700 hover:text-blue-700 font-semibold">Home</a>
          <a href="/wallet" className="text-gray-700 hover:text-blue-700 font-semibold">Wallet</a>
          <a href="/new" className="text-gray-700 hover:text-blue-700 font-semibold">New Listing</a>
        </nav>
      </header>
      <div className="flex gap-4 mb-4">
        <button className={`btn ${tab==='local'?'bg-blue-600 text-white':'bg-gray-200 text-gray-700'}`} onClick={()=>setTab('local')}>Saved Ads</button>
        <button className={`btn ${tab==='onchain'?'bg-blue-600 text-white':'bg-gray-200 text-gray-700'}`} onClick={()=>setTab('onchain')}>Live Ads (On-chain)</button>
      </div>
      <div className="card bg-white shadow rounded-xl p-4 mb-4">
        <div className="flex gap-2 items-center">
          <input className="input w-full" placeholder="Search listings…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      {tabContent}
    </div>
  );
}
