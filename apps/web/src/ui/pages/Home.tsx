
import { useEffect, useState } from 'react';
import { fetchListings, fetchOnchainListings, type Listing } from '../../lib/api';
import ListingCard from '../components/ListingCard';

export default function Home() {
  const [items, setItems] = useState<Listing[]>([]);
  const [onchainItems, setOnchainItems] = useState<Listing[]>([]);
  const [q, setQ] = useState('');
  const [showOnchain, setShowOnchain] = useState(false);
  useEffect(() => {
    if (showOnchain) {
      fetchOnchainListings().then(setOnchainItems);
    } else {
      fetchListings({ q }).then(setItems);
    }
  }, [q, showOnchain]);

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
      <div className="card bg-white shadow rounded-xl p-4 mb-4">
        <div className="flex gap-2 items-center">
          <input className="input w-full" placeholder="Search listings…" value={q} onChange={e => setQ(e.target.value)} />
          <button className={`btn ml-2 ${showOnchain ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setShowOnchain(v => !v)}>
            {showOnchain ? 'Show Local' : 'Show On-chain'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(showOnchain ? onchainItems : items).map(l => <ListingCard key={l.id} l={l} />)}
        {!(showOnchain ? onchainItems.length : items.length) && <div className="text-gray-500">No listings yet.</div>}
      </div>
    </div>
  );
}
