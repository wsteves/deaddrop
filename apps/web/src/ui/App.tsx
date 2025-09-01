import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import NewJob from './pages/NewJob';
import JobPreview from './pages/JobPreview';
import Wallet from './pages/Wallet';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';
import JobDetail from './pages/JobDetail';
import { JobModalProvider } from './JobModalContext';
import JobDetailModal from './components/JobDetailModal';
import { Navigate, useParams } from 'react-router-dom';

function RedirectLToJob() {
  const { id } = useParams();
  if (!id) return null;
  return <Navigate to={`/job/${id}`} replace />;
}

export default function App() {
  return (
    <JobModalProvider>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewJob />} />
            <Route path="/preview" element={<JobPreview />} />
            <Route path="/job/:id" element={<JobDetail />} />
            {/* Backwards-compatible redirect for legacy links (preserve id) */}
            <Route path="/l/:id" element={<RedirectLToJob />} />
            <Route path="/wallet" element={<Wallet />} />
          </Routes>
        </main>
        <JobDetailModal />
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: 'var(--accent-dropout)',
                secondary: 'white',
              },
            },
          }}
        />
      </div>
    </JobModalProvider>
  );
}
