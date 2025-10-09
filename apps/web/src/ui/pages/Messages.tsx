import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Button, Input } from '../components/DesignSystem';
import { generateSymmetricKey, encryptWithKeyRaw, bufToBase64, sealKeyForRecipient } from '../../lib/crypto';

export default function Messages() {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [recipientPub, setRecipientPub] = useState('');

  useEffect(() => {
    try { setUserId(localStorage.getItem('walletAddress') || null); } catch { setUserId(null); }
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/api/messages`, { params: { userId } }).then(res => {
      setMsgs(res.data || []);
    }).catch(() => setMsgs([])).finally(() => setLoading(false));
  }, [userId]);

  async function handleSend() {
    if (!userId) return alert('You must be connected to send messages');
    if (!to) return alert('recipient required');

    try {
      // 1) generate symmetric key
      const { key, raw } = await generateSymmetricKey();

      // 2) build plaintext payload (JSON)
      const plaintext = JSON.stringify({ subject, body: ciphertext, timestamp: Date.now(), from: userId });

      // 3) encrypt payload with symmetric key
      const enc = await encryptWithKeyRaw(raw, plaintext);

      // 4) store ciphertext on IPFS via storage endpoint
      const storeRes = await api.post('/api/storage/store', { data: { ciphertext: enc.ciphertextBase64, iv: enc.ivBase64, meta: { subject, from: userId } } });
      const storageId = storeRes.data?.id;

      // 5) seal symmetric key for recipient (attempt libsodium sealed box)
      const sealedKey = await sealKeyForRecipient(raw, recipientPub || '');

      // 6) create message record on server
      await api.post('/api/messages', { senderId: userId, recipientId: to, storageId, sealedKey, subject, snippet: (ciphertext || '').slice(0,120) });

      alert('Message queued');
      setCiphertext(''); setSubject(''); setTo(''); setRecipientPub('');
    } catch (e:any) {
      console.error(e);
      const details = e?.response?.data?.details || e?.message || String(e);
      alert('Failed to send message: ' + details);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input placeholder="Recipient wallet or userId" value={to} onChange={e => setTo(e.target.value)} />
        <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
        <div className="flex items-center">
          <Button onClick={handleSend} className="w-full">Send (store ciphertext)</Button>
        </div>
      </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea className="w-full p-3 border rounded-md" rows={6} placeholder="Message body (plain text will be encrypted)" value={ciphertext} onChange={e => setCiphertext(e.target.value)} />
          <div>
            <Input placeholder="Recipient public key (base64, optional - for sealed key)" value={recipientPub} onChange={e => setRecipientPub(e.target.value)} />
            <div className="text-xs text-muted mt-2">If you provide the recipient's Curve25519 public key (base64), the symmetric key will be sealed for them. Otherwise the key will be stored raw (insecure).</div>
          </div>
        </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Inbox</h3>
        {loading && <div>Loading...</div>}
        {!loading && msgs.length === 0 && <div>No messages</div>}
        <div className="space-y-3">
          {msgs.map(m => (
            <div key={m.id} className="p-3 border rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{m.subject || 'No subject'}</div>
                  <div className="text-sm text-muted">From: {m.senderId}</div>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm mt-2">{m.snippet}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
