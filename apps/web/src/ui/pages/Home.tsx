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
    <div className="space-y-8">
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-1">Discover Web3 Careers</h1>
            <p className="text-slate-300">Dropout — privacy-first, curated job listings for builders and creators.</p>
          </div>
          <div className="flex gap-2 items-center">
            <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search jobs, people, companies..." className="w-96 rounded-full" />
            <Button variant="ghost">Search</Button>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <Card>
              <div className="font-semibold">Refine results</div>
              <div className="mt-3 text-sm text-slate-400">Location</div>
              <Input placeholder="Remote, Berlin, US" />
              <div className="mt-3 text-sm text-slate-400">Experience level</div>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm">Entry</Button>
                <Button variant="ghost" size="sm">Mid</Button>
                <Button variant="ghost" size="sm">Senior</Button>
              </div>
              <div className="mt-4 text-sm text-slate-400">Employment type</div>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm">Full-time</Button>
                <Button variant="ghost" size="sm">Contract</Button>
              </div>
            </Card>

            <Card>
              <div className="font-semibold">Saved</div>
              <div className="mt-2 text-sm text-slate-400">{savedJobs.length} saved jobs</div>
            </Card>
          </aside>

          <main className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button variant={tab==='all' ? 'primary' : 'ghost'} onClick={()=>setTab('all')}>All</Button>
                <Button variant={tab==='saved' ? 'primary' : 'ghost'} onClick={()=>setTab('saved')}>Saved</Button>
                <Button variant={tab==='onchain' ? 'primary' : 'ghost'} onClick={()=>setTab('onchain')}>On-chain</Button>
              </div>
              <Button variant="secondary" onClick={() => window.location.href = '/new'}>Post a Job</Button>
            </div>

            {loading && <div className="text-center text-slate-400">Loading jobs…</div>}

            {tab === 'saved' ? (
              savedJobs.length ? <div className="space-y-4">{savedJobs.map(j => <JobCard key={j.id} job={j} useModal />)}</div> : <div className="text-center text-slate-500">No saved jobs yet.</div>
            ) : (
              jobs.length ? <div className="space-y-4">{jobs.map(j => <JobCard key={j.id} job={j} showPublish useModal />)}</div> : <div className="text-center text-slate-500">No jobs found.</div>
            )}
          </main>

          <aside className="lg:col-span-1 space-y-4">
            <Card>
              <div className="font-semibold">Suggested companies</div>
              <div className="mt-3 text-sm text-slate-400">Parity · Moonbeam · Open Source DAO</div>
            </Card>
            <Card>
              <div className="font-semibold">Hiring insights</div>
              <div className="mt-2 text-sm text-slate-400">Privacy-first hiring trends for Web3 roles.</div>
            </Card>
          </aside>
        </div>
      </div>

      <footer className="container text-center text-slate-400 py-8">
        <p>Dropout Jobs — built for privacy and the open web.</p>
      </footer>
    </div>
  );
}
