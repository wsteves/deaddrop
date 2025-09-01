import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <motion.article
      ref={nodeRef}
      role="button"
      tabIndex={0}
      aria-labelledby={`job-${job.id}-title`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white border border-[var(--border)] rounded-lg p-6 transition-all duration-200 hover:shadow-lg hover:border-[var(--accent-light)] cursor-pointer group relative overflow-hidden"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === 'A' || t.tagName === 'BUTTON' || t.closest('button') || t.closest('a')) return;
        if (useModal && modal && modal.open) return modal.open(job.id);
        navigate(`/job/${job.id}`);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') { if (useModal && modal && modal.open) modal.open(job.id); else navigate(`/job/${job.id}`); } }}
    >
      {/* Subtle top accent border that appears on hover */}
      <motion.div 
        initial={{ opacity: 0, scaleX: 0 }}
        whileHover={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dropout)] origin-left"
      />
      
      <div className="flex gap-4 items-start">
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <img 
            src={job.images?.[0] || 'https://via.placeholder.com/80'} 
            className="w-16 h-16 object-cover rounded-lg shadow-sm" 
            alt={`${job.company} logo`}
          />
          {job.commitHash && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
            >
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <motion.h3 
                id={`job-${job.id}-title`} 
                className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-200 truncate"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                {job.title}
              </motion.h3>
              <motion.div 
                className="text-sm text-[var(--text-secondary)] mt-1"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="font-medium">{job.company}</span>
                <span className="mx-1">•</span>
                <span>{job.location}</span>
              </motion.div>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <motion.div 
                className="text-xs text-[var(--text-muted)] mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {new Date(job.createdAt).toLocaleDateString()}
              </motion.div>
              <motion.div 
                className="inline-flex items-center px-3 py-1 bg-[var(--accent-light)] text-[var(--accent-primary)] rounded-full text-sm font-semibold"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {salaryLabel}
              </motion.div>
            </div>
          </div>

          <motion.p 
            className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {(job.description || '').slice(0, 150)}
            {(job.description || '').length > 150 && '...'}
          </motion.p>

          <motion.div 
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {(job.tags || '').split(',').slice(0, 4).map((t: string, i: number) => 
              t.trim() ? (
                <motion.span 
                  key={i} 
                  className="inline-flex items-center px-2.5 py-1 bg-[var(--accent-dropout-light)] text-[var(--accent-dropout)] rounded-md text-xs font-medium"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {t.trim()}
                </motion.span>
              ) : null
            )}
          </motion.div>

          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="sm" 
                  variant="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (useModal && modal && modal.open) return modal.open(job.id);
                    navigate(`/job/${job.id}`);
                  }}
                  className="shadow-sm"
                >
                  View Details
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); toggleSave(); }}
                  className={`${saved ? 'text-[var(--accent-dropout)] bg-[var(--accent-dropout-light)]' : ''}`}
                >
                  {saved ? '❤️ Saved' : '🤍 Save'}
                </Button>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-2">
              {job.commitHash ? (
                <motion.a
                  href={explorerTx || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✓ Verified
                </motion.a>
              ) : showPublish ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm" 
                    variant="dropout" 
                    onClick={(e) => { e.stopPropagation(); onPublish && onPublish(); }}
                  >
                    Publish
                  </Button>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}