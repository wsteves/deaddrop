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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-gray-900 text-slate-100">
        <Header />
        <main className="container mx-auto py-6 px-4">
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
        <footer className="container mx-auto py-10 text-center text-slate-400">
          Demo only. On-chain commitments use system.remark.
        </footer>
        <JobDetailModal />
  <Toaster position="bottom-right" />
      </div>
    </JobModalProvider>
  );
}
