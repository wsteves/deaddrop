
import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import NewListing from './pages/NewListing';
import ListingDetail from './pages/ListingDetail';
import Wallet from './pages/Wallet';

export default function App() {
  return (
    <div>
      <header className="bg-white border-b">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-bold text-lg">Polka Kleinanzeigen</Link>
          <nav className="flex gap-4">
            <Link to="/" className="hover:underline">Browse</Link>
            <Link to="/new" className="hover:underline">Sell</Link>
            <Link to="/wallet" className="hover:underline">Wallet</Link>
          </nav>
        </div>
      </header>
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewListing />} />
          <Route path="/l/:id" element={<ListingDetail />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
      </main>
      <footer className="container py-10 text-sm text-gray-500">
        Demo only. On-chain commitments use system.remark.
      </footer>
    </div>
  );
}
