import { useState } from 'react';
import { CreateListingResponse, createListing } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function NewListing() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [region, setRegion] = useState('Berlin');
  const [category, setCategory] = useState('general');
  const [seller, setSeller] = useState('did:example:you');
  const [images, setImages] = useState<string>('https://images.unsplash.com/photo-1524758631624-e2822e304c36');
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    toast.loading('Saving listing to database and Westend chain…');
    try {
      const res: CreateListingResponse = await createListing({
        title, description, price, region, category, seller, images: images ? images.split(',').map(s => s.trim()) : []
      });
      toast.dismiss();
      toast.success('Listing saved locally!');
      if (res.commitHash) {
        toast(
          <span>
            On-chain tx: <a href={`https://westend.subscan.io/extrinsic/${res.commitHash}`} target="_blank" className="underline text-blue-600">{res.commitHash.slice(0,10)}…</a>
          </span>
        );
      }
      nav('/l/' + res.id);
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.response?.data?.error?.fieldErrors?.description?.[0] || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4 max-w-2xl">
      <h2 className="font-semibold text-xl">Create a listing</h2>
      <div className="text-sm text-gray-600 mb-2">Your listing will be saved locally and published as a <span className="font-bold text-blue-600">remark</span> on the Westend chain for public discovery.</div>
      <div>
        <div className="label">Title</div>
        <input className="input" value={title} onChange={e=>setTitle(e.target.value)} disabled={loading} />
      </div>
      <div>
        <div className="label">Description</div>
        <textarea className="input h-32" value={description} onChange={e=>setDescription(e.target.value)} disabled={loading} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="label">Price (EUR)</div>
          <input type="number" className="input" value={price} onChange={e=>setPrice(parseInt(e.target.value||'0'))} disabled={loading} />
        </div>
        <div>
          <div className="label">Region</div>
          <input className="input" value={region} onChange={e=>setRegion(e.target.value)} disabled={loading} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="label">Category</div>
          <input className="input" value={category} onChange={e=>setCategory(e.target.value)} disabled={loading} />
        </div>
        <div>
          <div className="label">Seller (DID or handle)</div>
          <input className="input" value={seller} onChange={e=>setSeller(e.target.value)} disabled={loading} />
        </div>
      </div>
      <div>
        <div className="label">Image URLs (comma separated)</div>
        <input className="input" value={images} onChange={e=>setImages(e.target.value)} disabled={loading} />
      </div>
      <button onClick={submit} className={`btn w-full ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
    </div>
  );
}
