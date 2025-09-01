import React, { useEffect, useState, useRef } from 'react';
import { fetchJob, fetchOnchainListingById, type Job } from '../../lib/api';
import { useJobModal } from '../JobModalContext';

export default function JobDetailModal() {
  const { openId, close } = useJobModal();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!openId) {
        setJob(null);
        return;
      }
      setLoading(true);
      try {
        setIsLocalOnly(false);
        const j = await fetchJob(openId).catch(() => null);
        if (j && j.title) {
          if (!mounted) return;
          setJob(j);
          return;
        }

        const on = await fetchOnchainListingById(openId).catch((err: any) => ({ __error: err }));
        let candidate: any = null;
        if (on && !on.__error) {
          if (on.job) candidate = on.job;
          else if (on.listing) candidate = on.listing;
          else if (on.rawJson) candidate = on.rawJson;
        }

        if (candidate) {
          // If the on-chain remark was a primitive (e.g. a plain string like 'hero'),
          // normalize into a job-like object so the modal can render title/description.
          if (typeof candidate !== 'object' || candidate === null) {
            const text = String(candidate);
            const normalized: any = {
              id: openId,
              title: text.substring(0, 80),
              description: text,
              images: [],
              tags: '',
              company: '',
              location: ''
            };
            if (!mounted) return;
            setJob(normalized as Job);
          } else if (candidate.title) {
            if (!mounted) return;
            candidate.images = candidate.images || [];
            candidate.tags = Array.isArray(candidate.tags) ? candidate.tags.join(', ') : (candidate.tags || '');
            if (candidate.price !== undefined && !candidate.company) {
              candidate.company = candidate.seller || 'Unknown';
              candidate.salary = candidate.price;
              candidate.location = candidate.region || '';
              candidate.contact = candidate.seller || '';
            }
            setJob(candidate as Job);
          } else {
            // object but missing title: still normalize using available fields
            if (!mounted) return;
            candidate.images = candidate.images || [];
            candidate.tags = Array.isArray(candidate.tags) ? candidate.tags.join(', ') : (candidate.tags || '');
            const normalized: any = {
              id: openId,
              title: candidate.title || candidate.company || String(candidate.id) || 'Job',
              description: candidate.description || candidate.remarkText || '',
              ...candidate
            };
            setJob(normalized as Job);
          }
        } else {
          const local = await fetchJob(openId).catch(() => null);
          if (local && local.title) {
            if (!mounted) return;
            setJob(local);
            setIsLocalOnly(true);
          } else {
            if (!mounted) return;
            setJob(null);
          }
        }
      } catch (e) {
        if (mounted) setJob(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [openId]);

  // Focus management: trap focus inside modal and close on Escape
  useEffect(() => {
    if (!openId) return;
    const root = modalRef.current;
    firstFocusRef.current = document.activeElement as HTMLElement | null;
    const focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusable = root ? Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)) : [];
    if (focusable.length) focusable[0].focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab' && root) {
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(n => !n.hasAttribute('disabled'));
        if (nodes.length === 0) return;
        const idx = nodes.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey) {
          if (idx === 0) {
            nodes[nodes.length - 1].focus();
            e.preventDefault();
          }
        } else {
          if (idx === nodes.length - 1) {
            nodes[0].focus();
            e.preventDefault();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      try { if (firstFocusRef.current) firstFocusRef.current.focus(); } catch {}
    };
  }, [openId, close]);

  if (!openId) return null;

  const salaryLabel = job?.salaryMin || job?.salaryMax ? 
    `${job.salaryMin || ''}${job.salaryMin && job.salaryMax ? ' – ' : ''}${job.salaryMax || ''} €/year` : 
    (job?.salary ? `${job.salary} €/year` : 'Salary TBD');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" 
      role="dialog" 
      aria-modal="true" 
      onClick={() => close()}
    >
      <div 
        className="bg-white max-w-5xl w-full max-h-[90vh] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300" 
        ref={modalRef} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dropout)] p-6 text-white">
          <button 
            aria-label="Close job details" 
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => close()}
          >
            ✕
          </button>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mr-3"></div>
              <span className="text-lg">Loading opportunity details...</span>
            </div>
          )}
          
          {!loading && job && (
            <div className="pr-12">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-2xl font-bold">
                  {job.company?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="font-semibold">{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    {isLocalOnly && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-1 bg-yellow-500/20 rounded-md text-xs font-medium">
                          Draft
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{salaryLabel}</div>
                  {job.commitHash && (
                    <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm font-medium mt-2">
                      ✓ Verified
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(typeof job.tags === 'string' ? job.tags.split(',') : (job.tags || [])).slice(0, 6).map((tag: any, i: number) => 
                  tag ? (
                    <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {String(tag).trim()}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-200px)] overflow-hidden">
          {!loading && job && (
            <>
              {/* Main Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {job.images?.[0] && (
                  <div className="w-full h-48 mb-6 overflow-hidden rounded-lg bg-gray-100">
                    <img 
                      className="w-full h-full object-cover" 
                      src={job.images[0]} 
                      alt={job.title || 'Job image'} 
                    />
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">About This Role</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {(job.description && String(job.description).trim())
                          ? job.description
                          : ((job as any).remarkText || (job as any).rawJson?.description || 'No description provided.')
                        }
                      </p>
                    </div>
                  </div>

                  {job.benefits && (
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Benefits & Perks</h3>
                      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {job.benefits}
                      </p>
                    </div>
                  )}

                  <div className="bg-[var(--surface)] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Job Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)]">Experience Level</span>
                        <div className="font-medium text-[var(--text-primary)]">{job.level || 'Not specified'}</div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Employment Type</span>
                        <div className="font-medium text-[var(--text-primary)]">{job.employmentType || 'Not specified'}</div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Remote Work</span>
                        <div className="font-medium text-[var(--text-primary)]">{job.remote ? 'Remote-friendly' : 'On-site'}</div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Posted</span>
                        <div className="font-medium text-[var(--text-primary)]">
                          {new Date(job.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="w-full lg:w-80 bg-[var(--surface)] p-6 border-l border-[var(--border)] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{job.company}</h3>
                    
                    {job.contact && (
                      <div className="mb-4">
                        <span className="text-sm text-[var(--text-muted)]">Contact</span>
                        <div className="text-sm text-[var(--text-primary)] font-medium">{job.contact}</div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-[var(--text-muted)]">Salary Range</span>
                        <div className="text-lg font-semibold text-[var(--accent-primary)]">{salaryLabel}</div>
                      </div>

                      <div>
                        <span className="text-sm text-[var(--text-muted)]">Verification Status</span>
                        <div className="mt-1">
                          {job.commitHash ? (
                            <a
                              href={`https://westend.subscan.io/extrinsic/${job.commitHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium hover:bg-green-100 transition-colors"
                            >
                              ✓ Verified On-Chain
                            </a>
                          ) : (
                            <span className="text-[var(--text-muted)]">Not verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-[var(--border)]">
                    <a 
                      className="block w-full text-center py-3 px-4 bg-[var(--accent-dropout)] text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
                      href={job.contact?.startsWith('http') ? job.contact : `mailto:${job.contact}`}
                    >
                      Apply Now
                    </a>
                    
                    <button 
                      className="block w-full text-center py-2 px-4 border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.origin + '/job/' + job.id);
                        // You could add a toast here if available
                      }}
                    >
                      Share Job
                    </button>
                    
                    <button 
                      className="block w-full text-center py-2 px-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      onClick={() => {
                        // Save job logic here
                      }}
                    >
                      Save for Later
                    </button>
                  </div>
                </div>
              </aside>
            </>
          )}
          
          {!loading && !job && (
            <div className="flex-1 p-6 text-center">
              <div className="py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Job Not Found</h3>
                <p className="text-[var(--text-secondary)]">The job details you're looking for are not available.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
