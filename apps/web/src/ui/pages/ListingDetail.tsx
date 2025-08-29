
import { useEffect, useState } from 'react';
import { fetchListing, saveCommit, type Listing } from '../../lib/api';
import { computeCommit, initApi, ensureExtension, signRemark } from '../../lib/polkadot';
import { useParams } from 'react-router-dom';

export default function ListingDetail() {
  const { id } = useParams();
  const [l, setL] = useState<Listing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [extStatus, setExtStatus] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchListing(id).then(setL);
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        await ensureExtension();
        setExtStatus('Wallet extension detected.');
        const accs = (window as any).injectedWeb3 ? await (await import('@polkadot/extension-dapp')).web3Accounts() : [];
        setAccounts(accs);
        if (accs.length) setSelected(accs[0].address);
      } catch {
        setExtStatus('No Polkadot wallet extension found. Install Talisman or Polkadot.js.');
        setAccounts([]);
      }
    })();
  }, []);

  async function commitOnChain() {
    if (!l || !selected) return;
    try {
      setSubmitting(true);
      const api = await initApi();
      const { hex } = computeCommit({ id: l.id, title: l.title, price: l.price, region: l.region, seller: l.seller });
      const blockHash = await signRemark(api, selected, hex);
      setTxHash(blockHash);
      await saveCommit(l.id, hex);
      const updated = await fetchListing(l.id);
      setL(updated);
    } catch (e:any) {
      alert('Commit failed: ' + (e.message || e.toString()));
    } finally {
      setSubmitting(false);
    }
  }

  if (!l) return <div className="text-center py-12">Loading…</div>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 card bg-white shadow-lg rounded-xl p-6">
        <img src={l.images[0] || 'https://via.placeholder.com/800x500'} className="w-full max-h-[420px] object-cover rounded-xl border" />
        <div className="mt-4">
          <h1 className="font-bold text-3xl mb-2">{l.title}</h1>
          <div className="text-gray-600 mb-2">{l.region} · {l.category || 'general'}</div>
          <p className="mt-4 whitespace-pre-wrap text-lg">{l.description}</p>
        </div>
      </div>
      <div className="card space-y-4 bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-green-700">{l.price} €</div>
          <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">Seller: {l.seller}</span>
        </div>
        <div className="mt-2">
          <div className="font-semibold mb-1">Wallet Extension Status:</div>
          <div className="text-sm text-gray-700 mb-2">{extStatus}</div>
          {accounts.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="label">Select Account</label>
              <select className="input" value={selected} onChange={e=>setSelected(e.target.value)}>
                {accounts.map(acc => (
                  <option key={acc.address} value={acc.address}>{acc.meta.name || 'Account'} - {acc.address}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500">Selected: {selected}</div>
            </div>
          )}
          {accounts.length === 0 && (
            <div className="text-xs text-red-500">No accounts found. Open your wallet extension and authorize this app.</div>
          )}
        </div>
        {l.commitHash ? (
          <div className="text-xs text-green-700 break-all">On-chain commit: {l.commitHash}</div>
        ) : (
          <div className="text-xs text-amber-700">No on-chain commitment yet</div>
        )}
        <button onClick={commitOnChain} disabled={submitting || !selected} className="btn w-full mt-2">
          {submitting ? 'Committing…' : 'Commit on-chain (system.remark)'}
        </button>
        {txHash && <div className="text-xs text-gray-600 break-all">Included in block: {txHash}</div>}
      </div>
    </div>
  );
}
