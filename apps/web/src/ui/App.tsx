import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Browse from './pages/Browse';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900/20 to-purple-950 opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/browse" element={<Browse />} />
          </Routes>
        </main>
      </div>
      
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(45, 27, 78, 0.95)',
            backdropFilter: 'blur(20px)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.3)',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
          loading: {
            iconTheme: {
              primary: '#8b5cf6',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
}
