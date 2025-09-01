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
      {/* Joyful Anti-Corporate Hero Section */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden border-b border-[var(--border)]"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite'
        }}
      >
        {/* Animated gradient overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10"
        />
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Playful circles */}
          <motion.div 
            initial={{ opacity: 0, scale: 0, x: -100, y: 100 }}
            animate={{ opacity: 0.6, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-400/40 blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0, x: 200, y: -50 }}
            animate={{ opacity: 0.4, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 2.5, delay: 0.8, ease: "easeOut" }}
            className="absolute top-40 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-pink-300/50 to-purple-400/50 blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0, x: -150, y: -100 }}
            animate={{ opacity: 0.5, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 2.2, delay: 1.1, ease: "easeOut" }}
            className="absolute bottom-32 left-32 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-300/60 to-blue-400/60 blur-sm"
          />
          
          {/* Geometric decorations */}
          <motion.div 
            initial={{ opacity: 0, rotate: -45, scale: 0.5 }}
            animate={{ opacity: 0.3, rotate: 0, scale: 1 }}
            transition={{ duration: 3, delay: 0.3, ease: "easeOut" }}
            className="absolute top-1/4 right-1/4 w-24 h-24 transform rotate-12"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
              <polygon points="50,15 80,30 80,70 50,85 20,70 20,30" fill="rgba(255,255,255,0.1)" />
            </svg>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, rotate: 45, scale: 0.3 }}
            animate={{ opacity: 0.4, rotate: 0, scale: 1 }}
            transition={{ duration: 2.8, delay: 0.7, ease: "easeOut" }}
            className="absolute bottom-1/3 right-12 w-16 h-16 transform -rotate-12"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="25" y="25" width="50" height="50" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" rx="8" />
              <rect x="35" y="35" width="30" height="30" fill="rgba(255,255,255,0.15)" rx="4" />
            </svg>
          </motion.div>
          
          {/* Floating sparkles */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 0], y: [-20, -40, -60] }}
            transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute top-1/3 left-1/3 text-white/60"
          >
            ✨
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: [0, 1, 0], y: [-15, -35, -55] }}
            transition={{ duration: 2.5, delay: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute top-1/2 right-1/3 text-white/50"
          >
            ⭐
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: [0, 1, 0], y: [-25, -45, -65] }}
            transition={{ duration: 3.5, delay: 1.8, repeat: Infinity, ease: "easeOut" }}
            className="absolute bottom-1/2 left-1/4 text-white/60"
          >
            💫
          </motion.div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Bold, joyful headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"
            >
              Find your future
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="block text-yellow-200 text-shadow-sm"
              >
                Tune in and <span className="bg-white/20 px-3 py-1 rounded-full text-white shadow-lg">dropout</span> ✨
              </motion.span>
            </motion.h1>

            {/* Animated taglines */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="relative h-8 mb-10 overflow-hidden text-xl md:text-2xl text-white/90"
            >
              <motion.div 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="font-medium drop-shadow-sm">Search. Connect. Build. 🚀</span>
              </motion.div>
            </motion.div>
            
            {/* Enhanced Search Bar with glassmorphism */}
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
                  placeholder="Smart contracts..." 
                  className="h-14 pl-12 pr-4 text-lg rounded-full shadow-2xl border-2 border-white/30 focus:border-white/60 bg-white/20 backdrop-blur-md text-white placeholder:text-white/70 transition-all duration-300 hover:bg-white/30 focus:bg-white/30"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <Button 
                variant="dropout" 
                size="lg" 
                className="h-14 rounded-full px-7 text-lg shadow-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/50 transition-all duration-300"
              >
                ✨ Search
              </Button>
            </motion.div>
            
            {/* Fun Stats with colorful icons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/90 max-w-3xl mx-auto"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
              >
                <span className="text-lg">🎯</span>
                <span className="font-medium">{jobs.length} jobs waiting</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.9 }}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
              >
                <span className="text-lg">🔐</span>
                <span className="font-medium">{jobs.filter(j => j.commitHash).length} blockchain verified</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 2.1 }}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
              >
                <span className="text-lg">🌍</span>
                <span className="font-medium">Work from anywhere</span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Colorful floating category bubbles */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="relative border-t border-white/20 py-4 bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-sm"
        >
          <div className="flex gap-6 whitespace-nowrap text-xs font-medium tracking-wide text-white/80 animate-scroll">
            <div className="flex items-center gap-6 px-6">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-gradient-to-r from-yellow-400/30 to-orange-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🏆 grants
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="bg-gradient-to-r from-pink-400/30 to-purple-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                💰 bounties
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 3 }}
                className="bg-gradient-to-r from-blue-400/30 to-cyan-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🏛️ daos
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -3 }}
                className="bg-gradient-to-r from-green-400/30 to-emerald-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🔬 zk research
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 4 }}
                className="bg-gradient-to-r from-indigo-400/30 to-purple-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🗳️ governance
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -2 }}
                className="bg-gradient-to-r from-red-400/30 to-pink-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🏗️ infrastructure
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 2 }}
                className="bg-gradient-to-r from-yellow-400/30 to-amber-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                👾 hackathons
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -4 }}
                className="bg-gradient-to-r from-teal-400/30 to-cyan-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                ⏰ coretime
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 3 }}
                className="bg-gradient-to-r from-violet-400/30 to-purple-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                💎 defi
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -1 }}
                className="bg-gradient-to-r from-emerald-400/30 to-green-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🔗 parachain dev
              </motion.span>
              {/* Duplicate for seamless loop */}
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-gradient-to-r from-yellow-400/30 to-orange-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🏆 grants
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="bg-gradient-to-r from-pink-400/30 to-purple-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                💰 bounties
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 3 }}
                className="bg-gradient-to-r from-blue-400/30 to-cyan-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🏛️ daos
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -3 }}
                className="bg-gradient-to-r from-green-400/30 to-emerald-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🔬 zk research
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 4 }}
                className="bg-gradient-to-r from-indigo-400/30 to-purple-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🗳️ governance
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -2 }}
                className="bg-gradient-to-r from-red-400/30 to-pink-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🏗️ infrastructure
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 2 }}
                className="bg-gradient-to-r from-yellow-400/30 to-amber-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                👾 hackathons
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -4 }}
                className="bg-gradient-to-r from-teal-400/30 to-cyan-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                ⏰ coretime
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 3 }}
                className="bg-gradient-to-r from-violet-400/30 to-purple-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                💎 defi
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -1 }}
                className="bg-gradient-to-r from-emerald-400/30 to-green-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
              >
                🔗 parachain dev
              </motion.span>
            </div>
          </div>
        </motion.div>
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
                      <p className="text-xs text-[var(--text-secondary)]">{job.companyId}</p>
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
