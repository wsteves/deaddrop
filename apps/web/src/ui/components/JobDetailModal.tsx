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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" onClick={() => close()}>
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 max-w-6xl w-full mx-4 rounded-xl shadow-xl overflow-hidden" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="flex flex-col lg:flex-row">
          {loading && <div className="p-8 w-full text-center text-slate-400">Loading…</div>}
          {!loading && job && (
            <>
              <div className="lg:flex-1 p-6">
                <div className="w-full h-56 lg:h-72 overflow-hidden rounded-lg bg-slate-700">
                  <img className="w-full h-full object-cover" src={job.images?.[0] || 'https://via.placeholder.com/1200x480'} alt={job.title || 'job image'} />
                </div>
                <h2 className="text-2xl font-extrabold mt-4">{job.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-sm text-slate-400">{job.company} · {job.location}</div>
                  {isLocalOnly && <div className="text-xs px-2 py-1 rounded bg-yellow-900 text-yellow-300">Draft</div>}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-400">
                  <div>Level</div>
                  <div className="font-medium text-slate-200">{job.level || 'Not specified'}</div>
                  <div>Employment</div>
                  <div className="font-medium text-slate-200">{job.employmentType || 'Not specified'}</div>
                  <div>Remote</div>
                  <div className="font-medium text-slate-200">{job.remote ? 'Remote-friendly' : 'On-site'}</div>
                  <div>Posted</div>
                  <div className="font-medium text-slate-200">{new Date(job.createdAt).toLocaleDateString()}</div>
                </div>
                {/* Description: prefer explicit description, then try common fallbacks (remarkText/rawJson.description) */}
                <div className="mt-4 text-slate-300 leading-relaxed whitespace-pre-line">{
                  (job.description && String(job.description).trim())
                    ? job.description
                    : ((job as any).remarkText || (job as any).rawJson?.description || 'No description provided.')
                }</div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(typeof job.tags === 'string' ? job.tags.split(',') : (job.tags || [])).slice(0,8).map((t:any,i:number) => t ? <span key={i} className="text-xs bg-slate-700 px-2 py-1 rounded">{String(t).trim()}</span> : null)}
                </div>
              </div>
              <aside className="w-full lg:w-96 p-6 border-l border-slate-700">
                <div className="font-semibold text-lg">{job.company}</div>
                <div className="text-sm text-slate-400 mt-2">Contact: {job.contact || '—'}</div>
                <div className="mt-4">
                  <div className="text-sm text-slate-400">Benefits</div>
                  <div className="mt-1 text-sm text-slate-200">{job.benefits || 'Not specified'}</div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-400">Salary</div>
                  <div className="mt-1 font-medium">{job.salaryMin || job.salaryMax ? `${job.salaryMin ?? ''}${job.salaryMin && job.salaryMax ? ' – ' : ''}${job.salaryMax ?? ''} €` : (job.salary ? `${job.salary} €` : 'TBD')}</div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-400">Status</div>
                  <div className="mt-1">{job.commitHash ? <span className="px-2 py-1 rounded bg-emerald-700 text-sm">Published</span> : <span className="text-slate-400">Not published</span>}</div>
                </div>
                <div className="mt-6">
                  <a className="inline-block w-full text-center px-4 py-2 rounded bg-emerald-600" href={job.contact?.startsWith('http') ? job.contact : `mailto:${job.contact}`}>Apply</a>
                </div>
                {job.commitHash && (
                  <div className="mt-4 text-sm">
                    <a className="text-slate-300 underline" target="_blank" rel="noreferrer" href={`https://westend.subscan.io/extrinsic/${job.commitHash}`}>View on explorer</a>
                  </div>
                )}
              </aside>
            </>
          )}
          {!loading && !job && (
            <div className="p-6">No details available for this job.</div>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <button aria-label="Close job details" className="text-slate-300 bg-slate-700/40 hover:bg-slate-700/60 rounded-full p-2" onClick={() => close()}>✕</button>
        </div>
      </div>
    </div>
  );
}
