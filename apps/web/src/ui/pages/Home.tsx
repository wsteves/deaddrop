import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchJobs, type Job } from '../../lib/api';
import JobCard from '../components/JobCard';
import { Input, Button, Card } from '../components/DesignSystem';

// Marquee item component for the category scroll
function MarqueeItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative">
      <span className="relative z-10">{children}</span>
      <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dropout)] opacity-60" />
    </span>
  );
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'all'|'saved'|'onchain'>('all');
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSavedIds(s);
    } catch { setSavedIds([]); }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchJobs({ q }).then(list => {
      setJobs(list || []);
    }).catch(() => setJobs([])).finally(() => setLoading(false));
  }, [q]);

  const savedJobs = jobs.filter(j => savedIds.includes(j.id));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Anti-LinkedIn Hero Section */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-white border-b border-[var(--border)] relative overflow-hidden"
      >
        {/* Ambient gradient wash */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 via-transparent to-[var(--accent-dropout)]/10"
        />
        
        {/* Floating blockchain graphic */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 0.6, scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute -right-20 -top-28 w-[34rem] h-[34rem] pointer-events-none"
        >
          <div className="absolute inset-0 animate-pulse">
            <svg viewBox="0 0 600 600" className="w-full h-full">
              <defs>
                <linearGradient id="chainGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--accent-dropout)" stopOpacity="0.4" />
                </linearGradient>
                <pattern id="hexPattern" width="40" height="34.64" patternUnits="userSpaceOnUse">
                  <path d="M20 0 L40 10 L40 24.64 L20 34.64 L0 24.64 L0 10 Z" fill="none" stroke="url(#chainGrad)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="600" height="600" fill="url(#hexPattern)" />
              {/* Chain links */}
              <g>
                <path d="M160 180 h110 a24 24 0 0 1 0 48 h-110 a24 24 0 0 1 0 -48" fill="none" stroke="url(#chainGrad)" strokeWidth="4" />
                <path d="M270 180 h110 a24 24 0 0 1 0 48 h-110 a24 24 0 0 1 0 -48" fill="none" stroke="url(#chainGrad)" strokeWidth="4" />
              </g>
            </svg>
          </div>
        </motion.div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Bold, rebellious headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-6 leading-tight"
            >
              Find your future
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-purple-500 to-[var(--accent-dropout)]"
              >
                Tune in and <span className="underline decoration-dashed decoration-2">dropout</span>
              </motion.span>
            </motion.h1>

            {/* Rotating taglines */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="relative h-8 mb-10 overflow-hidden text-xl md:text-2xl text-[var(--text-secondary)]"
            >
              <motion.div 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="font-medium">Web3 Job Market. Find. Connect. Build.</span>
              </motion.div>
            </motion.div>
            
            {/* Enhanced Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex items-center justify-center gap-3 max-w-2xl mx-auto mb-8"
            >
              <div className="relative flex-1">
                <Input 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  placeholder="Search roles, skills, companies…" 
                  className="h-14 pl-12 pr-4 text-lg rounded-full shadow-lg border-2 border-transparent focus:border-[var(--accent-primary)] bg-white transition-all duration-200 hover:shadow-xl"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <Button variant="dropout" size="lg" className="h-14 rounded-full px-7 text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                Search
              </Button>
            </motion.div>
            
            {/* Enhanced Stats with icons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[var(--text-secondary)] max-w-3xl mx-auto"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
                className="flex items-center gap-2"
              >
                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-transparent shadow">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>{jobs.length} active opportunities</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.9 }}
                className="flex items-center gap-2"
              >
                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-dropout)] to-transparent shadow">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>{jobs.filter(j => j.commitHash).length} verified positions</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 2.1 }}
                className="flex items-center gap-2"
              >
                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-transparent shadow">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>Remote-friendly</span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Kinetic category marquee */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="relative border-t border-[var(--border)]/70 py-3 bg-gradient-to-r from-transparent via-[var(--surface)] to-transparent"
        >
          <div className="flex gap-10 whitespace-nowrap text-xs uppercase tracking-wider text-[var(--text-muted)] animate-scroll">
            <div className="flex items-center gap-10 px-6">
              <MarqueeItem>grants</MarqueeItem>
              <MarqueeItem>bounties</MarqueeItem>
              <MarqueeItem>daos</MarqueeItem>
              <MarqueeItem>zk research</MarqueeItem>
              <MarqueeItem>governance</MarqueeItem>
              <MarqueeItem>infrastructure</MarqueeItem>
              <MarqueeItem>hackathons</MarqueeItem>
              <MarqueeItem>coretime</MarqueeItem>
              <MarqueeItem>defi</MarqueeItem>
              <MarqueeItem>parachain dev</MarqueeItem>
              {/* Duplicate for seamless loop */}
              <MarqueeItem>grants</MarqueeItem>
              <MarqueeItem>bounties</MarqueeItem>
              <MarqueeItem>daos</MarqueeItem>
              <MarqueeItem>zk research</MarqueeItem>
              <MarqueeItem>governance</MarqueeItem>
              <MarqueeItem>infrastructure</MarqueeItem>
              <MarqueeItem>hackathons</MarqueeItem>
              <MarqueeItem>coretime</MarqueeItem>
              <MarqueeItem>defi</MarqueeItem>
              <MarqueeItem>parachain dev</MarqueeItem>
            </div>
          </div>
        </motion.div>

        {/* Accent bottom glow */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 3 }}
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--accent-primary)]/10 to-transparent pointer-events-none"
        />
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Refine Your Search
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Location</label>
                  <Input placeholder="Remote, Berlin, Global..." className="text-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Experience Level</label>
                  <div className="flex flex-wrap gap-2">
                    {['Junior', 'Mid-level', 'Senior', 'Lead'].map((level) => (
                      <Button key={level} variant="ghost" size="sm" className="text-xs border border-[var(--border)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]">
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Work Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Full-time', 'Contract', 'Freelance', 'Part-time'].map((type) => (
                      <Button key={type} variant="ghost" size="sm" className="text-xs border border-[var(--border)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]">
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Salary Range</label>
                  <div className="space-y-2">
                    <Input placeholder="Min salary" className="text-sm" />
                    <Input placeholder="Max salary" className="text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[var(--accent-dropout)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Your Saved Jobs
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {savedJobs.length} position{savedJobs.length !== 1 ? 's' : ''} saved
              </p>
              {savedJobs.length > 0 ? (
                <div className="space-y-2">
                  {savedJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] hover:border-[var(--accent-dropout)] transition-colors cursor-pointer">
                      <h4 className="font-medium text-sm text-[var(--text-primary)] truncate">{job.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-[var(--accent-dropout)] hover:bg-[var(--accent-dropout-light)]"
                    onClick={() => setTab('saved')}
                  >
                    View all saved →
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No saved jobs yet. Start exploring!</p>
              )}
            </div>
          </aside>

          {/* Enhanced Main Content */}
          <main className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between bg-white rounded-xl border border-[var(--border)] p-4 shadow-sm">
              <div className="flex gap-2">
                <Button 
                  variant={tab === 'all' ? 'primary' : 'ghost'} 
                  onClick={() => setTab('all')}
                  size="sm"
                  className="relative"
                >
                  All Jobs
                  <span className="ml-2 px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent-primary)] rounded-full text-xs font-bold">
                    {jobs.length}
                  </span>
                </Button>
                <Button 
                  variant={tab === 'saved' ? 'primary' : 'ghost'} 
                  onClick={() => setTab('saved')}
                  size="sm"
                  className="relative"
                >
                  Saved
                  <span className="ml-2 px-2 py-0.5 bg-[var(--accent-dropout-light)] text-[var(--accent-dropout)] rounded-full text-xs font-bold">
                    {savedJobs.length}
                  </span>
                </Button>
                <Button 
                  variant={tab === 'onchain' ? 'primary' : 'ghost'} 
                  onClick={() => setTab('onchain')}
                  size="sm"
                  className="relative"
                >
                  Verified
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {jobs.filter(j => j.commitHash).length}
                  </span>
                </Button>
              </div>
              <Button 
                variant="dropout" 
                size="sm"
                onClick={() => window.location.href = '/new'}
                className="shadow-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post Job
              </Button>
            </div>

            {loading && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center shadow-sm">
                <div className="inline-flex items-center px-6 py-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                  <div className="animate-spin mr-3 h-5 w-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full"></div>
                  <span className="text-[var(--text-secondary)] font-medium">Finding opportunities...</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {tab === 'saved' ? (
                savedJobs.length ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <AnimatePresence>
                      {savedJobs.map((j, index) => (
                        <motion.div
                          key={j.id}
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -30, scale: 0.95 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                        >
                          <JobCard job={j} useModal />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No saved jobs yet</h3>
                    <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">Start exploring and save interesting opportunities to build your personal job collection</p>
                    <Button variant="primary" onClick={() => setTab('all')} className="px-6">
                      Browse All Jobs
                    </Button>
                  </div>
                )
              ) : tab === 'onchain' ? (
                jobs.filter(j => j.commitHash).length ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <AnimatePresence>
                      {jobs.filter(j => j.commitHash).map((j, index) => (
                        <motion.div
                          key={j.id}
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -30, scale: 0.95 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                        >
                          <JobCard job={j} showPublish useModal />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">🔗</div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No verified jobs found</h3>
                    <p className="text-[var(--text-secondary)] max-w-md mx-auto">Verified jobs are cryptographically secured on the blockchain for maximum trust and transparency</p>
                  </div>
                )
              ) : (
                jobs.length ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <AnimatePresence>
                      {jobs.map((j, index) => (
                        <motion.div
                          key={j.id}
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -30, scale: 0.95 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                        >
                          <JobCard job={j} showPublish useModal />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No jobs found</h3>
                    <p className="text-[var(--text-secondary)] mb-6">Try adjusting your search criteria or check back later for new opportunities</p>
                    <Button variant="primary" onClick={() => setQ('')} className="px-6">
                      Clear Search
                    </Button>
                  </div>
                )
              )}
            </div>
          </main>

          {/* Enhanced Right Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Featured Companies
              </h3>
              <div className="space-y-4">
                {[
                  { name: 'Parity Technologies', openings: 12, verified: true },
                  { name: 'Moonbeam Network', openings: 8, verified: true },
                  { name: 'Polkadot Fellowship', openings: 5, verified: false },
                  { name: 'Web3 Foundation', openings: 3, verified: true }
                ].map((company, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dropout)] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {company.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
                          {company.name}
                        </div>
                        {company.verified && (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">{company.openings} open positions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-dropout)]/5 rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[var(--accent-dropout)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Market Insights
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-[var(--accent-primary)] mb-1">{jobs.length}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Active Jobs</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-[var(--accent-dropout)] mb-1">{jobs.filter(j => j.commitHash).length}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Verified</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">{Math.round(jobs.filter(j => j.remote).length / Math.max(jobs.length, 1) * 100)}%</div>
                  <div className="text-xs text-[var(--text-secondary)]">Remote</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">24h</div>
                  <div className="text-xs text-[var(--text-secondary)]">Avg Response</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
