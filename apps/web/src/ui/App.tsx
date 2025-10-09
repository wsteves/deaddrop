import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Browse from './pages/Browse';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/browse" element={<Browse />} />
        </Routes>
      </main>
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
  );
}
