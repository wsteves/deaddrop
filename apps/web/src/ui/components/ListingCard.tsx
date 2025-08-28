
import { Link } from 'react-router-dom';
import type { Listing } from '../../lib/api';

export default function ListingCard({ l }: { l: Listing }) {
  return (
    <Link to={`/l/${l.id}`} className="card block hover:shadow-md transition">
      <div className="flex gap-4">
        <img src={l.images[0] || 'https://via.placeholder.com/160'} className="w-40 h-28 object-cover rounded-xl" />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg">{l.title}</h3>
            <div className="font-bold">{l.price} €</div>
          </div>
          <div className="text-sm text-gray-600 mt-1">{l.region} · {l.category || 'general'}</div>
          {l.commitHash && <div className="mt-2 text-xs text-green-700">On-chain commit: {l.commitHash.slice(0,10)}…</div>}
        </div>
      </div>
    </Link>
  );
}
