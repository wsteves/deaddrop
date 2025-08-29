
import { Link } from 'react-router-dom';
import type { Listing } from '../../lib/api';

export default function ListingCard({ l }: { l: Listing }) {
  return (
    <Link to={`/l/${l.id}`} className="card block bg-white rounded-xl shadow hover:shadow-xl transition border border-gray-100 p-4 group">
      <div className="flex gap-4 items-center">
        <img src={l.images[0] || 'https://via.placeholder.com/160'} className="w-32 h-24 object-cover rounded-lg border" />
        <div className="flex-1 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg group-hover:text-blue-700 transition">{l.title}</h3>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold shadow">{l.price} €</span>
          </div>
          <div className="text-xs text-gray-500 mb-1">{l.region} · {l.category || 'general'}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs">{l.seller[0] || '?'}</span>
            <span className="text-xs text-gray-700">{l.seller}</span>
          </div>
          {l.commitHash && <div className="mt-2 text-xs text-green-700">On-chain: {l.commitHash.slice(0,10)}…</div>}
        </div>
      </div>
    </Link>
  );
}
