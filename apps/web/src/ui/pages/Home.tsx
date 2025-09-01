import { useEffect, useState } from 'react';
import { fetchJobs, type Job } from '../../lib/api';
import JobCard from '../components/JobCard';
import { Input, Button, Card } from '../components/DesignSystem';

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
      {/* Enhanced Hero Section */}
      <header className="bg-white border-b border-[var(--border)] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-dropout)]/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--accent-dropout)]/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
              Discover Your Next
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-dropout)]">
                Alternative Career
              </span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-8 leading-relaxed max-w-2xl mx-auto">
              Professional opportunities beyond traditional employment. Connect with companies that value independence, creativity, and the decentralized future.
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto mb-8">
              <div className="relative flex-1">
                <Input 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  placeholder="Search roles, skills, companies..." 
                  className="pl-12 pr-4 py-4 text-lg rounded-full shadow-lg border-2 border-transparent focus:border-[var(--accent-primary)] bg-white"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <Button variant="dropout" size="lg" className="rounded-full px-8 py-4 text-lg shadow-lg">
                Search
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"></span>
                <span>{jobs.length} active opportunities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--accent-dropout)] rounded-full"></span>
                <span>{jobs.filter(j => j.commitHash).length} verified positions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Remote-friendly</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                  savedJobs.map(j => <JobCard key={j.id} job={j} useModal />)
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
                  jobs.filter(j => j.commitHash).map(j => <JobCard key={j.id} job={j} showPublish useModal />)
                ) : (
                  <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">🔗</div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No verified jobs found</h3>
                    <p className="text-[var(--text-secondary)] max-w-md mx-auto">Verified jobs are cryptographically secured on the blockchain for maximum trust and transparency</p>
                  </div>
                )
              ) : (
                jobs.length ? (
                  jobs.map(j => <JobCard key={j.id} job={j} showPublish useModal />)
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
