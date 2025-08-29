import React, { useEffect, useState } from 'react';
import { createJob, saveJobCommit } from '../../lib/api';
import toast from 'react-hot-toast';
import { Input, Button, Card, Textarea } from '../components/DesignSystem';
import { computeCommit, initApi, signRemark, connectExtension } from '../../lib/polkadot';
import { useNavigate } from 'react-router-dom';

export default function NewJob() {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salary, setSalary] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [level, setLevel] = useState('Mid');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [remote, setRemote] = useState(true);
  const [tags, setTags] = useState('');
  const [contact, setContact] = useState('');
  const [benefits, setBenefits] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();
  const [publishOnChain, setPublishOnChain] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Autosave draft to localStorage
  useEffect(() => {
  const draft = { title, company, location, salary, level, employmentType, tags, description };
    localStorage.setItem('jobDraft', JSON.stringify(draft));
  }, [title, company, location, salary, description]);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('jobDraft') || 'null');
      if (d) {
    setTitle(d.title || ''); setCompany(d.company || ''); setLocation(d.location || 'Remote'); setSalary(d.salary || ''); setLevel(d.level || 'Mid'); setEmploymentType(d.employmentType || 'Full-time'); setTags(d.tags || ''); setDescription(d.description || '');
      }
    } catch {}
  }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createJob({
        title,
        company,
        location,
        salary: salary ? Number(salary) : undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        employmentType,
        level,
        remote,
        contact,
        benefits,
        description,
        tags: tags || '',
        images: ['']
      });
      localStorage.removeItem('jobDraft');
    // Optionally publish on-chain using the user's extension (client-side signing)
    if (publishOnChain) {
      setStatusMessage('Preparing on-chain publish…');
      try {
        const accs = await connectExtension('Dropout Jobs');
        if (!accs || accs.length === 0) throw new Error('No accounts available');
        const from = accs[0].address;
        setStatusMessage('Connecting to network…');
        const api = await initApi();
  setStatusMessage('Computing commit…');
  const commit = await computeCommit({ id: created.id, title, salary: salary ? Number(salary) : undefined, salaryMin: salaryMin ? Number(salaryMin) : undefined, salaryMax: salaryMax ? Number(salaryMax) : undefined, location: location || '', employmentType, level, remote, contact });
        setStatusMessage('Requesting signature from extension…');
        const { web3FromAddress } = await import('@polkadot/extension-dapp');
        const injector = await web3FromAddress(from);
        const { buildRemark } = await import('@polka-kleinanzeigen/chain');
        const tx = buildRemark(api, commit.hex);
        const blockHash = await new Promise<string>((resolve, reject) => {
          tx.signAndSend(from, { signer: injector.signer }, (r: any) => {
            if (r.dispatchError) return reject(r.dispatchError.toString());
            if (r.status?.isInBlock) return resolve(r.status.asInBlock.toString());
          }).catch(reject);
        });
        setStatusMessage('Saving commit metadata…');
        await saveJobCommit(created.id, commit.hex, blockHash, null as any, from).catch(() => null);
  setStatusMessage('Published on-chain ✓');
  toast.success('Published on-chain ✓');
      } catch (err:any) {
  console.warn('On-chain publish failed or skipped:', err);
  setStatusMessage('On-chain publish skipped or failed');
  toast.error('On-chain publish failed: ' + (err?.message || String(err)));
      }
    }

    // Navigate to job page
    try { nav(`/job/${created.id}`); } catch {}
    } catch (err) {
      alert('Failed to post');
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Post a Job</h1>
        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6" onSubmit={handlePost}>
          <Card className="p-6">
            <label className="label">Title</label>
            <Input value={title} onChange={e=>setTitle(e.target.value)} name="title" disabled={saving} />

            <label className="label mt-4">Company</label>
            <Input value={company} onChange={e=>setCompany(e.target.value)} name="company" disabled={saving} />

            <label className="label mt-4">Location</label>
            <Input value={location} onChange={e=>setLocation(e.target.value)} name="location" disabled={saving} />
            <label className="label mt-4">Location</label>
            <Input value={location} onChange={e=>setLocation(e.target.value)} name="location" disabled={saving} />

            <label className="label mt-4">Salary (single value)</label>
            <Input value={salary} onChange={e=>setSalary(e.target.value.replace(/[^0-9]/g,''))} name="salary" disabled={saving} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input value={salaryMin} onChange={e=>setSalaryMin(e.target.value)} placeholder="Min" disabled={saving} />
              <Input value={salaryMax} onChange={e=>setSalaryMax(e.target.value)} placeholder="Max" disabled={saving} />
            </div>
          </Card>

          <Card className="p-6">
            <label className="label">Description</label>
            <Textarea className="h-48" value={description} onChange={e=>setDescription(e.target.value)} name="description" disabled={saving} />

            <label className="label mt-4">Tags (comma separated)</label>
            <Input value={tags} onChange={e=>setTags(e.target.value)} placeholder="rust, substrate, frontend" disabled={saving} />

            <label className="label mt-4">Contact (email or handle)</label>
            <Input value={contact} onChange={e=>setContact(e.target.value)} placeholder="contact@dropout.example" disabled={saving} />

            <label className="label mt-4">Benefits</label>
            <Textarea className="h-24" value={benefits} onChange={e=>setBenefits(e.target.value)} name="benefits" disabled={saving} />

            <div className="mt-4 flex items-center gap-2">
              <input id="remote" type="checkbox" checked={remote} onChange={e=>setRemote(e.target.checked)} disabled={saving} />
              <label htmlFor="remote" className="text-sm text-slate-300">Remote friendly</label>
            </div>

            <label className="label mt-4">Level</label>
            <select value={level} onChange={e=>setLevel(e.target.value)} className="input" disabled={saving}>
              <option>Intern</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>

            <label className="label mt-4">Employment type</label>
            <select value={employmentType} onChange={e=>setEmploymentType(e.target.value)} className="input" disabled={saving}>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Temporary</option>
              <option>Internship</option>
            </select>

            <div className="mt-4 flex items-center gap-2">
              <input id="publish" type="checkbox" checked={publishOnChain} onChange={e=>setPublishOnChain(e.target.checked)} disabled={saving} />
              <label htmlFor="publish" className="text-sm text-slate-300">Publish on-chain (system.remark)</label>
            </div>

            {statusMessage && <div className="mt-3 text-sm text-slate-400">{statusMessage}</div>}

            <div className="mt-6 flex gap-2 justify-end">
              <Button variant="ghost" type="button" onClick={() => { const preview = { title, company, location, salary, salaryMin, salaryMax, level, employmentType, remote, tags, description, contact, benefits }; localStorage.setItem('jobPreview', JSON.stringify(preview)); try { nav('/preview'); } catch {} }} disabled={saving}>Preview</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Posting…' : 'Post Job'}</Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}