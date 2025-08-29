import { useEffect, useState } from 'react';
import type { Job } from '../../lib/api';
import { fetchJob, saveJobCommit } from '../../lib/api';
import { ensureExtension, initApi, computeCommit, signRemark } from '../../lib/polkadot';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button, Card } from '../components/DesignSystem';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [publishing, setPublishing] = useState(false);
  const nav = useNavigate();
  // Get wallet address from localStorage (set by Wallet.tsx)
  const [address, setAddress] = useState<string>('');
  useEffect(() => {
    const addr = localStorage.getItem('walletAddress') || '';
    setAddress(addr);
  }, []);

  useEffect(() => {
    if (id) fetchJob(id).then(setJob);
  }, [id]);

  async function handlePublish() {
    if (!job) return;
    if (!address) {
      toast.error('No wallet address selected. Connect your wallet first.');
      return;
    }
    setPublishing(true);
    try {
      await ensureExtension('Polka Jobs');
      const api = await initApi();
  const commit = await computeCommit(job as any);
      const { web3Accounts, web3FromAddress } = await import('@polkadot/extension-dapp');
      const accounts = await web3Accounts();
      if (!accounts || accounts.length === 0) throw new Error('No accounts available in extension');
      const from = accounts[0].address;
      const injector = await web3FromAddress(from);
      // build remark tx and sign/send using injector
  const { buildRemark } = await import('@polka-kleinanzeigen/chain');
  const tx = buildRemark(api, commit.hex);
      const result = await new Promise<string>((resolve, reject) => {
        tx.signAndSend(from, { signer: injector.signer }, (r: any) => {
          if (r.dispatchError) return reject(r.dispatchError.toString());
          if (r.status?.isInBlock) return resolve(r.status.asInBlock.toString());
        }).catch(reject);
      });
      // save commit metadata
      await saveJobCommit(job.id, commit.hex, result, null as any, from);
      const updated = await fetchJob(job.id);
      setJob(updated);
      toast.success('Job published to chain!');
      nav('/');
    } catch (err: any) {
      toast.error('Failed to publish job: ' + (err?.message || String(err)));
    } finally {
      setPublishing(false);
    }
  }

  if (!job) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  return (
    <div className="bg-gradient-to-b from-slate-900 to-gray-900 min-h-screen text-white">
      <header className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <div className="text-sm text-slate-300">{job.company || ''} · {job.location || ''} · {job.tags || ''}</div>
            <div className="mt-2">
              <Button className="mr-2">Apply</Button>
              <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share</Button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">Save</Button>
            <Button onClick={() => { navigator.clipboard?.writeText(job.contact || ''); }}>Contact</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">About the role</h2>
            <p className="text-slate-300">{job.description}</p>

            <h3 className="text-md font-semibold mt-6 mb-2">Responsibilities</h3>
            <ul className="list-disc list-inside text-slate-300">
              <li>Ship high-quality software and collaborate with cross-functional teams</li>
              <li>Participate in design and architecture discussions</li>
            </ul>

            <h3 className="text-md font-semibold mt-6 mb-2">Qualifications</h3>
            <ul className="list-disc list-inside text-slate-300">
              <li>Relevant Web3 experience</li>
              <li>2+ years in similar roles</li>
            </ul>

            <div className="mt-6">
              <Button className="mr-2">Apply now</Button>
              <Button variant="ghost">Message recruiter</Button>
            </div>
            </Card>
          </div>
          <aside className="sticky top-24">
            <Card className="p-6">
            <div className="mb-4">
              <h4 className="text-sm text-slate-300">Salary</h4>
              <div className="font-semibold">{job.salaryMin || job.salaryMax ? `${job.salaryMin ?? ''}${job.salaryMin && job.salaryMax ? ' – ' : ''}${job.salaryMax ?? ''} €` : 'TBD'}</div>
            </div>

              <div className="mb-4">
                <h4 className="text-sm text-slate-300">On-chain status</h4>
                <div>{job.commitHash ? <span className="px-2 py-1 bg-green-600 rounded text-sm">Published</span> : <span className="text-slate-400">Not published</span>}</div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm text-slate-300">Posted</h4>
                <div className="text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="mt-6">
                <Button className="mr-2">Apply now</Button>
                <Button variant="ghost">Message recruiter</Button>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <footer className="bg-slate-900 py-8 mt-8">
        <div className="container mx-auto text-center text-slate-400">Dropout Jobs — privacy-first job board for Web3.</div>
      </footer>
    </div>
  );
}
