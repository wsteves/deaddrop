import { useEffect, useState } from 'react';
import type { Job } from '../../lib/api';
import { fetchJob, saveJobCommit } from '../../lib/api';
import { ensureExtension, initApi, computeCommit, signRemark } from '../../lib/polkadot';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

  if (!job) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="bg-white rounded-lg border border-[var(--border)] p-8 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)]">Loading opportunity details...</p>
      </div>
    </div>
  );

  const salaryLabel = job.salaryMin || job.salaryMax ? 
    `${job.salaryMin || ''}${job.salaryMin && job.salaryMax ? ' – ' : ''}${job.salaryMax || ''} €/year` : 
    (job.salary ? `${job.salary} €/year` : 'Salary TBD');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dropout)] rounded-lg flex items-center justify-center text-white text-xl font-bold">
                  {job.company?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{job.title}</h1>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <span className="font-semibold">{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span className="text-[var(--text-muted)]">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {(job.tags || '').split(',').filter(t => t.trim()).map((tag, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center px-3 py-1 bg-[var(--accent-dropout-light)] text-[var(--accent-dropout)] rounded-full text-sm font-medium"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="dropout" className="px-8 shadow-sm">
                  Apply Now
                </Button>
                <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  Share
                </Button>
                <Button variant="ghost">
                  Save Job
                </Button>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--accent-primary)] mb-1">
                {salaryLabel}
              </div>
              {job.commitHash && (
                <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified On-Chain
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">About This Role</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </div>

            {job.benefits && (
              <div className="bg-white rounded-lg border border-[var(--border)] p-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Benefits & Perks</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {job.benefits}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Ready to Apply?</h2>
              <div className="flex items-center gap-4">
                <Button variant="dropout" className="px-8">
                  Apply Now
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    if (job.contact) {
                      navigator.clipboard?.writeText(job.contact);
                      toast.success('Contact info copied to clipboard!');
                    }
                  }}
                >
                  Copy Contact Info
                </Button>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-4">
                Contact: {job.contact || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white rounded-lg border border-[var(--border)] p-6 sticky top-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Job Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Salary Range</h4>
                  <div className="text-lg font-semibold text-[var(--text-primary)]">{salaryLabel}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Experience Level</h4>
                  <div className="text-[var(--text-primary)]">{job.level || 'Not specified'}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Employment Type</h4>
                  <div className="text-[var(--text-primary)]">{job.employmentType || 'Not specified'}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Remote Work</h4>
                  <div className="text-[var(--text-primary)]">{job.remote ? 'Yes' : 'No'}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Verification Status</h4>
                  <div>
                    {job.commitHash ? (
                      <a
                        href={`https://westend.subscan.io/extrinsic/${job.commitHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium hover:bg-green-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </a>
                    ) : address ? (
                      <Button 
                        size="sm" 
                        variant="dropout" 
                        onClick={handlePublish}
                        disabled={publishing}
                        className="text-xs"
                      >
                        {publishing ? 'Publishing...' : 'Publish On-Chain'}
                      </Button>
                    ) : (
                      <span className="text-[var(--text-muted)]">Not verified</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Posted Date</h4>
                  <div className="text-[var(--text-primary)]">
                    {new Date(job.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <Button variant="dropout" className="w-full mb-3">
                  Apply Now
                </Button>
                <Button variant="ghost" className="w-full">
                  Save for Later
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
