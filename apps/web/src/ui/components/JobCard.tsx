import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../lib/api';
import { Button } from './DesignSystem';
import { useJobModal } from '../JobModalContext';

export default function JobCard({ job, showPublish, onPublish, useModal }: { job: Job, showPublish?: boolean, onPublish?: () => void, useModal?: boolean }) {
  const explorerTx = job.commitHash ? `https://westend.subscan.io/extrinsic/${job.commitHash}` : null;
  const explorerBlock = job.blockNumber ? `https://westend.subscan.io/block/${job.blockNumber}` : null;
  const [saved, setSaved] = useState(false);
  const detailsRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const nodeRef = useRef<HTMLElement | null>(null);
  const modal = useJobModal();
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('savedJobs' ) || '[]');
      setSaved(s.includes(job.id));
    } catch { setSaved(false); }
  }, [job.id]);

  // Reveal card when it enters viewport
  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) el.classList.add('visible'); });
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function toggleSave() {
    try {
      const s = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      if (s.includes(job.id)) {
        const next = s.filter((x: string) => x !== job.id);
        localStorage.setItem('savedJobs', JSON.stringify(next));
        setSaved(false);
      } else {
        s.push(job.id);
        localStorage.setItem('savedJobs', JSON.stringify(s));
        setSaved(true);
      }
    } catch {
      localStorage.setItem('savedJobs', JSON.stringify([job.id]));
      setSaved(true);
    }
  }



  const salaryLabel = job.salaryMin || job.salaryMax ? (job.salaryMin && job.salaryMax ? `${job.salaryMin}–${job.salaryMax} €` : `${job.salary ?? (job.salaryMin ?? job.salaryMax)} €`) : (job.salary ? `${job.salary} €` : 'TBD');

  return (
    <article
      ref={nodeRef}
      role="button"
      tabIndex={0}
      aria-labelledby={`job-${job.id}-title`}
      className="bg-slate-800 rounded-xl p-4 transition-transform transform hover:scale-[1.01] cursor-pointer"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === 'A' || t.tagName === 'BUTTON' || t.closest('button') || t.closest('a')) return;
        if (useModal && modal && modal.open) return modal.open(job.id);
        navigate(`/job/${job.id}`);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') { if (useModal && modal && modal.open) modal.open(job.id); else navigate(`/job/${job.id}`); } }}
    >
      <div className="flex gap-4 items-start">
        <img src={job.images?.[0] || 'https://via.placeholder.com/120'} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 id={`job-${job.id}-title`} className="text-lg font-semibold">{job.title}</h3>
              <div className="text-sm text-slate-400">{job.company} · {job.location}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</div>
              <div className="mt-2"><div className="inline-block px-2 py-1 bg-slate-700 rounded text-sm font-medium">{salaryLabel}</div></div>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-300 line-clamp-3">{(job.description || '').slice(0, 180)}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(job.tags || '').split(',').slice(0,6).map((t: string, i: number) => t.trim() ? <span className="text-xs bg-slate-700 px-2 py-1 rounded" key={i}>{t.trim()}</span> : null)}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={(e) => {
                e.stopPropagation();
                if (useModal && modal && modal.open) return modal.open(job.id);
                navigate(`/job/${job.id}`);
              }}>View</Button>
              <Button variant="ghost" onClick={(e) => { e.stopPropagation(); toggleSave(); }}>{saved ? 'Saved' : 'Save'}</Button>
              <Button variant="ghost" onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.origin + '/job/' + job.id); }}>Share</Button>
            </div>
            <div className="flex items-center gap-2">
              {job.commitHash ? <span className="text-xs bg-emerald-700 px-2 py-1 rounded">On-chain</span> : showPublish ? <Button onClick={(e) => { e.stopPropagation(); onPublish && onPublish(); }}>Publish</Button> : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}