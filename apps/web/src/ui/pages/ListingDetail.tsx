
import { useEffect, useState } from 'react';
import { fetchListing, saveCommit, type Listing } from '../../lib/api';
import { computeCommit, initApi, ensureExtension, signRemark } from '../../lib/polkadot';
import { useParams } from 'react-router-dom';

export default function ListingDetail() {
  const { id } = useParams();
  const [l, setL] = useState<Listing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    fetchListing(id).then(setL);
  }, [id]);

  async function commitOnChain() {
    if (!l) return;
    try {
      setSubmitting(true);
      await ensureExtension();
      // In a real app you'd let user pick their address from the extension:
      const addr = (window as any)?.injectedWeb3 ? Object.values((window as any).injectedWeb3)[0] : null;
      // For demo, ask user to paste an address:
      const from = address || prompt('Enter your Polkadot address to sign from:') || '';
      if (!from) throw new Error('No address provided');
      const api = await initApi();
      const { hex } = computeCommit({ id: l.id, title: l.title, price: l.price, region: l.region, seller: l.seller });
      const blockHash = await signRemark(api, from, hex);
      setTxHash(blockHash);
      await saveCommit(l.id, hex);
      const updated = await fetchListing(l.id);
      setL(updated);
    } catch (e:any) {
      alert('Commit failed: ' + e.message || e.toString());
    } finally {
      setSubmitting(false);
    }
  }

  if (!l) return <div>Loading…</div>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card">
        <img src={l.images[0] || 'https://via.placeholder.com/800x500'} className="w-full max-h-[420px] object-cover rounded-xl" />
        <div className="mt-4">
          <h1 className="font-semibold text-2xl">{l.title}</h1>
          <div className="text-gray-600 mt-1">{l.region} · {l.category || 'general'}</div>
          <p className="mt-4 whitespace-pre-wrap">{l.description}</p>
        </div>
      </div>
      <div className="card space-y-3">
        <div className="text-2xl font-bold">{l.price} €</div>
        <div className="text-sm text-gray-600">Seller: {l.seller}</div>
        {l.commitHash ? (
          <div className="text-xs text-green-700 break-all">On-chain commit: {l.commitHash}</div>
        ) : (
          <div className="text-xs text-amber-700">No on-chain commitment yet</div>
        )}
        <input className="input" placeholder="Your Polkadot address" value={address} onChange={e=>setAddress(e.target.value)} />
        <button onClick={commitOnChain} disabled={submitting} className="btn w-full">
          {submitting ? 'Committing…' : 'Commit on-chain (system.remark)'}
        </button>
        {txHash && <div className="text-xs text-gray-600 break-all">Included in block: {txHash}</div>}
      </div>
    </div>
  );
}
