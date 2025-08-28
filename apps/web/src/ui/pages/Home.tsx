
import { useEffect, useState } from 'react';
import { fetchListings, type Listing } from '../../lib/api';
import ListingCard from '../components/ListingCard';

export default function Home() {
  const [items, setItems] = useState<Listing[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    fetchListings({ q }).then(setItems);
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex gap-2">
          <input className="input" placeholder="Search listings…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(l => <ListingCard key={l.id} l={l} />)}
        {!items.length && <div className="text-gray-500">No listings yet.</div>}
      </div>
    </div>
  );
}
