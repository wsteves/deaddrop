
import { useState } from 'react';
import { createListing } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export default function NewListing() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [region, setRegion] = useState('Berlin');
  const [category, setCategory] = useState('general');
  const [seller, setSeller] = useState('did:example:you');
  const [images, setImages] = useState<string>('https://images.unsplash.com/photo-1524758631624-e2822e304c36');
  const nav = useNavigate();

  async function submit() {
    const res = await createListing({
      title, description, price, region, category, seller, images: images ? images.split(',').map(s => s.trim()) : []
    });
    nav('/l/' + res.id);
  }

  return (
    <div className="card space-y-4 max-w-2xl">
      <h2 className="font-semibold text-xl">Create a listing</h2>
      <div>
        <div className="label">Title</div>
        <input className="input" value={title} onChange={e=>setTitle(e.target.value)} />
      </div>
      <div>
        <div className="label">Description</div>
        <textarea className="input h-32" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="label">Price (EUR)</div>
          <input type="number" className="input" value={price} onChange={e=>setPrice(parseInt(e.target.value||'0'))} />
        </div>
        <div>
          <div className="label">Region</div>
          <input className="input" value={region} onChange={e=>setRegion(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="label">Category</div>
          <input className="input" value={category} onChange={e=>setCategory(e.target.value)} />
        </div>
        <div>
          <div className="label">Seller (DID or handle)</div>
          <input className="input" value={seller} onChange={e=>setSeller(e.target.value)} />
        </div>
      </div>
      <div>
        <div className="label">Image URLs (comma separated)</div>
        <input className="input" value={images} onChange={e=>setImages(e.target.value)} />
      </div>
      <button onClick={submit} className="btn">Save</button>
    </div>
  );
}
