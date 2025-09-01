import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Job } from '../../lib/api';
import { fetchJobWithStorage } from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card } from '../components/DesignSystem';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const nav = useNavigate();

  // Check if job is saved
  useEffect(() => {
    if (job) {
      try {
        const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        setSaved(savedJobs.includes(job.id));
      } catch {
        setSaved(false);
      }
    }
  }, [job]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      fetchJobWithStorage(id)
        .then(setJob)
        .catch((err: any) => {
          console.error('Failed to fetch job:', err);
          setError('Failed to load job details. This job might not exist or there was a network error.');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const toggleSave = () => {
    if (!job) return;
    try {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      if (savedJobs.includes(job.id)) {
        const filtered = savedJobs.filter((jobId: string) => jobId !== job.id);
        localStorage.setItem('savedJobs', JSON.stringify(filtered));
        setSaved(false);
        toast.success('Job removed from saved');
      } else {
        savedJobs.push(job.id);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        setSaved(true);
        toast.success('Job saved!');
      }
    } catch {
      toast.error('Failed to save job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[var(--border)] p-8 text-center shadow-lg"
        >
          <div className="animate-spin h-12 w-12 border-3 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Loading Job Details</h3>
          <p className="text-[var(--text-secondary)]">Please wait while we fetch the opportunity details...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[var(--border)] p-8 text-center shadow-lg max-w-md mx-auto"
        >
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Job Not Found</h3>
          <p className="text-[var(--text-secondary)] mb-6">
            {error || "This job opportunity doesn't exist or has been removed."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="ghost" 
              onClick={() => nav('/')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Button>
            <Button 
              variant="primary" 
              onClick={() => nav('/new')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post a Job
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const salaryLabel = job.salaryMin || job.salaryMax ? 
    `€${job.salaryMin || ''}${job.salaryMin && job.salaryMax ? ' - ' : ''}€${job.salaryMax || ''}` : 
    (job.salary ? `€${job.salary}` : 'Salary TBD');

  const displayCompany = job.companyId || 'Company';
  const tagsArray: string[] = job.tags || [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Breadcrumb Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-[var(--border)] sticky top-0 z-10"
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => nav('/')}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Jobs
              </Button>
              <div className="h-6 w-px bg-[var(--border)]" />
              <div className="text-sm text-[var(--text-muted)]">
                Job Details
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={toggleSave}
                className={`flex items-center gap-2 ${saved ? 'text-[var(--accent-dropout)]' : ''}`}
              >
                <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {saved ? 'Saved' : 'Save Job'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Job Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Job Header */}
          <Card className="p-8 mb-8 shadow-lg">
            <div className="flex gap-6 items-start">
              {/* Company Logo */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dropout)] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {displayCompany.charAt(0).toUpperCase()}
                </div>
                {job.storageId && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-between items-start mb-4"
                >
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 leading-tight">
                      {job.title}
                    </h1>
                    <div className="flex items-center gap-3 text-[var(--text-secondary)] text-lg">
                      <span className="font-semibold">{displayCompany}</span>
                      {job.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>
                        </>
                      )}
                      {job.remote === 'remote' && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-medium">Remote OK</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-[var(--text-muted)]">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-6 flex-shrink-0">
                    <div className="text-sm text-[var(--text-muted)] mb-2">Salary</div>
                    <div className="text-2xl font-bold text-[var(--accent-primary)]">{salaryLabel}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">per year</div>
                  </div>
                </motion.div>

                {/* Job Details Badges */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-3 mb-6"
                >
                  {job.employmentType && (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                      {job.employmentType.replace('-', ' ')}
                    </span>
                  )}
                  {job.experienceLevel && (
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                      {job.experienceLevel} Level
                    </span>
                  )}
                  {job.storageId && (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                      </svg>
                      Decentralized
                    </span>
                  )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-3"
                >
                  <Button 
                    variant="dropout" 
                    size="lg" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (job.applicationEmail) {
                        window.location.href = `mailto:${job.applicationEmail}?subject=Application for ${job.title}`;
                      } else {
                        toast.error('No application method specified');
                      }
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Apply Now
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={toggleSave}
                    className={`flex items-center gap-2 ${saved ? 'text-[var(--accent-dropout)] bg-[var(--accent-dropout-light)]' : ''}`}
                  >
                    <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {saved ? 'Saved' : 'Save Job'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>

          {/* Job Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About this role</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {job.description || 'No description provided.'}
                    </p>
                  </div>
                </Card>
              </motion.div>

              {/* Benefits */}
              {job.benefits && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Benefits & Perks</h2>
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {job.benefits}
                    </p>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Job Details</h3>
                  <div className="space-y-4">
                    {job.applicationEmail && (
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">Contact</div>
                        <div className="text-sm text-[var(--text-secondary)]">{job.applicationEmail}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">Posted</div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {new Date(job.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    {job.storageId && (
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">Storage</div>
                        <div className="text-xs text-[var(--text-secondary)] space-y-1">
                          <div>Stored on IPFS</div>
                          <div className="font-mono text-xs bg-gray-100 p-1 rounded break-all">
                            {job.storageId.substring(0, 20)}...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Skills/Tags */}
              {tagsArray.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {tagsArray.map((tag: string, i: number) => (
                        <span 
                          key={i}
                          className="inline-flex items-center px-3 py-1 bg-[var(--accent-dropout-light)] text-[var(--accent-dropout)] rounded-lg text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
