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
  const accs = await connectExtension('Polkadot Jobs');
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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Post a New Opportunity</h1>
          <p className="text-[var(--text-secondary)]">Share your open position with the alternative economy community</p>
        </div>

        <form onSubmit={handlePost} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center">
              <span className="w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Job Title *"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Senior Frontend Developer"
                disabled={saving}
                required
              />
              
              <Input
                label="Company Name *"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Your Company"
                disabled={saving}
                required
              />
              
              <Input
                label="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Remote, Berlin, Global"
                disabled={saving}
              />
              
              <Input
                label="Contact Email *"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="hiring@company.com"
                disabled={saving}
                type="email"
                required
              />
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center">
              <span className="w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Compensation & Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Input
                label="Fixed Salary (€/year)"
                value={salary}
                onChange={e => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="75000"
                disabled={saving}
              />
              
              <Input
                label="Salary Min (€/year)"
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="60000"
                disabled={saving}
              />
              
              <Input
                label="Salary Max (€/year)"
                value={salaryMax}
                onChange={e => setSalaryMax(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="90000"
                disabled={saving}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Experience Level</label>
                <select 
                  value={level} 
                  onChange={e => setLevel(e.target.value)} 
                  className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                  disabled={saving}
                >
                  <option>Intern</option>
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                  <option>Lead</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Employment Type</label>
                <select 
                  value={employmentType} 
                  onChange={e => setEmploymentType(e.target.value)} 
                  className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                  disabled={saving}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Temporary</option>
                  <option>Internship</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="flex items-center">
                <input 
                  id="remote" 
                  type="checkbox" 
                  checked={remote} 
                  onChange={e => setRemote(e.target.checked)} 
                  disabled={saving}
                  className="w-4 h-4 text-[var(--accent-primary)] bg-white border-[var(--border)] rounded focus:ring-[var(--accent-primary)]"
                />
                <span className="ml-2 text-sm font-medium text-[var(--text-primary)]">Remote-friendly position</span>
              </label>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center">
              <span className="w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Job Description
            </h2>
            
            <div className="space-y-6">
              <Textarea
                label="Role Description *"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity unique..."
                className="h-40"
                disabled={saving}
                required
              />
              
              <Input
                label="Skills & Tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="React, TypeScript, Web3, Rust, Remote"
                disabled={saving}
              />
              
              <Textarea
                label="Benefits & Perks"
                value={benefits}
                onChange={e => setBenefits(e.target.value)}
                placeholder="Health insurance, flexible hours, learning budget, equity..."
                className="h-24"
                disabled={saving}
              />
            </div>
          </div>

          {/* Blockchain Options */}
          <div className="bg-gradient-to-r from-[var(--accent-dropout-light)] to-purple-50 rounded-lg border border-[var(--accent-dropout)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
              <span className="w-8 h-8 bg-[var(--accent-dropout)] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">🔗</span>
              Blockchain Verification
            </h2>
            
            <div className="flex items-start space-x-3">
              <input 
                id="publish" 
                type="checkbox" 
                checked={publishOnChain} 
                onChange={e => setPublishOnChain(e.target.checked)} 
                disabled={saving}
                className="w-4 h-4 text-[var(--accent-dropout)] bg-white border-[var(--border)] rounded focus:ring-[var(--accent-dropout)] mt-1"
              />
              <div>
                <label htmlFor="publish" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
                  Publish on-chain for verification
                </label>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Cryptographically secure your job posting on the Polkadot network. This creates an immutable record and builds trust with candidates.
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full"></div>
                <span className="text-sm text-[var(--accent-primary)]">{statusMessage}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-[var(--border)] p-6">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => { 
                const preview = { title, company, location, salary, salaryMin, salaryMax, level, employmentType, remote, tags, description, contact, benefits }; 
                localStorage.setItem('jobPreview', JSON.stringify(preview)); 
                try { nav('/preview'); } catch {} 
              }} 
              disabled={saving}
            >
              Preview Job
            </Button>
            
            <Button 
              type="submit" 
              variant="dropout" 
              disabled={saving || !title || !company || !description || !contact}
              className="px-8"
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Posting...
                </>
              ) : (
                'Post Opportunity'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}