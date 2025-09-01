import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/DesignSystem';
import toast from 'react-hot-toast';

export default function JobPreview() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  let preview: any = null;
  try { 
    preview = JSON.parse(localStorage.getItem('jobPreview') || 'null'); 
  } catch {}
  
  if (!preview) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8"
        >
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No Preview Available</h2>
          <p className="text-[var(--text-secondary)] mb-6">Start creating a job post to see the preview</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/new')}
            className="px-6"
          >
            Create Job Post
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleSaveAsDraft = async () => {
    setSaving(true);
    try {
      // Save to localStorage with a timestamp
      const drafts = JSON.parse(localStorage.getItem('jobDrafts') || '[]');
      const newDraft = {
        ...preview,
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        type: 'draft'
      };
      drafts.push(newDraft);
      localStorage.setItem('jobDrafts', JSON.stringify(drafts));
      
      toast.success('Draft saved successfully!');
      
      // Optional: Clear the current preview
      localStorage.removeItem('jobPreview');
      
      setTimeout(() => navigate('/new'), 1000);
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate('/new');
  };

  const salaryDisplay = preview.salaryMin || preview.salaryMax ? 
    (preview.salaryMin && preview.salaryMax ? 
      `€${preview.salaryMin} - €${preview.salaryMax}` : 
      `€${preview.salary || preview.salaryMin || preview.salaryMax}`) : 
    (preview.salary ? `€${preview.salary}` : 'Salary TBD');

  const tagsArray = preview.tags ? preview.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
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
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Edit
              </Button>
              <div className="h-6 w-px bg-[var(--border)]" />
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Job Preview</h1>
                <p className="text-sm text-[var(--text-secondary)]">How your job post will appear to candidates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={handleSaveAsDraft}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save as Draft
                  </>
                )}
              </Button>
              <Button 
                variant="dropout" 
                onClick={() => navigate('/new')}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Job Card Preview */}
          <Card className="p-8 shadow-lg">
            <div className="flex gap-6 items-start">
              {/* Company Logo Placeholder */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dropout)] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {preview.company ? preview.company.charAt(0).toUpperCase() : 'C'}
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs">✨</span>
                </motion.div>
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-between items-start mb-4"
                >
                  <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 leading-tight">
                      {preview.title || 'Job Title'}
                    </h2>
                    <div className="flex items-center gap-3 text-[var(--text-secondary)] text-lg">
                      <span className="font-semibold">{preview.company || 'Company Name'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {preview.location || 'Location'}
                      </span>
                      {preview.remote && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-medium">Remote OK</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-6 flex-shrink-0">
                    <div className="text-sm text-[var(--text-muted)] mb-2">Salary</div>
                    <div className="text-2xl font-bold text-[var(--accent-primary)]">{salaryDisplay}</div>
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
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {preview.employmentType || 'Full-time'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {preview.level || 'Mid'} Level
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Fresh Post
                  </span>
                </motion.div>

                {/* Skills/Tags */}
                {tagsArray.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Required Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {tagsArray.map((tag: string, i: number) => (
                        <motion.span 
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.05 }}
                          className="inline-flex items-center px-3 py-1 bg-[var(--accent-dropout-light)] text-[var(--accent-dropout)] rounded-lg text-sm font-medium"
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Job Description */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6"
                >
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">About this role</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {preview.description || 'No description provided yet...'}
                    </p>
                  </div>
                </motion.div>

                {/* Benefits */}
                {preview.benefits && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mb-6"
                  >
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Benefits & Perks</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {preview.benefits}
                    </p>
                  </motion.div>
                )}

                {/* Application Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="border-t border-[var(--border)] pt-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Ready to apply?</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Contact: <span className="font-medium text-[var(--text-primary)]">{preview.contact || 'contact@company.com'}</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" size="lg" className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Save Job
                      </Button>
                      <Button variant="dropout" size="lg" className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </Card>

          {/* Preview Notice */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="text-blue-500 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Preview Mode</h4>
                <p className="text-sm text-blue-700">
                  This is how your job posting will appear to candidates. You can save this as a draft to continue later, 
                  or go back to make changes before publishing.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
