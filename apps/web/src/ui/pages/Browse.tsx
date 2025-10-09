import React, { useEffect, useState } from 'react';
import { defaultStorage } from '../../lib/storage';
import { Button } from '../components/DesignSystem';
import toast from 'react-hot-toast';

function RecentList({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems] = useState<Array<any>>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dripdrop:recent') || '[]';
      setItems(JSON.parse(raw));
    } catch { setItems([]); }
  }, []);

  if (!items.length) return null;
  return (
    <div className="bg-white p-4 rounded-lg">
      <h3 className="font-medium">Recent uploads</h3>
      <ul className="mt-2 space-y-2">
        {items.map((it: any) => (
          <li key={it.id} className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-sm text-[var(--text-secondary)]">{new Date(it.when).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => onOpen(it.id)}>Open</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Browse() {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<any | null>(null);

  async function openId(value?: string) {
    const cid = value ?? id;
    if (!cid) return toast('Enter an ID');
    setLoading(true);
    setContent(null);
    try {
      const data = await defaultStorage.retrieve(cid);
      setContent(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to retrieve content');
    } finally { setLoading(false); }
  }

  function downloadAsFile(obj: any) {
    try {
      const arr = new Uint8Array(obj.data || []);
      const blob = new Blob([arr], { type: obj.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = obj.filename || 'file';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Browse DripDrop</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex gap-3">
              <input className="flex-1 border rounded px-3 py-2" placeholder="Enter ID / CID" value={id} onChange={e => setId(e.target.value)} />
              <Button onClick={() => openId()} variant="primary">Open</Button>
            </div>
            <div className="mt-4">
              {loading && <div className="text-[var(--text-secondary)]">Loading…</div>}
              {content && (
                <div className="bg-[var(--surface)] p-4 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{content.filename || 'Untitled'}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{content.type || 'unknown'} • {content.size ? Math.round(content.size/1024) + ' KB' : ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => downloadAsFile(content)}>Download</Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    {content.type && content.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(new Blob([new Uint8Array(content.data)]))} alt="preview" className="max-w-full rounded" />
                    ) : (
                      <pre className="text-sm overflow-auto max-h-96 p-2 bg-white rounded">{content && content.type && content.type.startsWith('text/') ? new TextDecoder().decode(new Uint8Array(content.data || [])) : JSON.stringify({ filename: content.filename, type: content.type }, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <RecentList onOpen={(i) => { setId(i); openId(i); }} />
        </div>
      </div>
    </div>
  );
}
