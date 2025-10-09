import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(10, 10, 20, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${0.6 - i * 0.005})`;
        ctx.fill();

        particles.forEach((p2, j) => {
          if (i === j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(236, 72, 153, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent z-0" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen">
        
        {/* Glowing orb effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-75 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-2xl shadow-2xl border border-purple-400/30">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-300%">
              DripDrop
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-purple-200/90 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
            Decentralized file drops on <span className="text-pink-400 font-semibold">IPFS</span>
            <br />
            <span className="text-sm text-purple-300/70">Private • Resilient • Unstoppable</span>
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 py-4">
            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full backdrop-blur-sm">
              <span className="text-purple-300 text-sm font-medium">🔐 End-to-end encrypted</span>
            </div>
            <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/30 rounded-full backdrop-blur-sm">
              <span className="text-pink-300 text-sm font-medium">⚡ Lightning fast</span>
            </div>
            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full backdrop-blur-sm">
              <span className="text-purple-300 text-sm font-medium">🌐 Distributed network</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/upload" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200" />
              <button className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-200 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Drop a file
              </button>
            </Link>

            <Link to="/browse" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/50 to-pink-600/50 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200" />
              <button className="relative px-8 py-4 bg-slate-900/80 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl text-purple-300 font-bold text-lg hover:border-purple-400/50 transition-all duration-200 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse files
              </button>
            </Link>
          </div>

          {/* Info section */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-slate-900/40 backdrop-blur-md border border-purple-500/20 rounded-xl hover:border-purple-500/40 transition-all duration-300 group">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💧</div>
              <h3 className="text-lg font-bold text-purple-300 mb-2">Drop & Share</h3>
              <p className="text-sm text-purple-200/60">Upload files instantly to IPFS and share via content-addressed links</p>
            </div>

            <div className="p-6 bg-slate-900/40 backdrop-blur-md border border-pink-500/20 rounded-xl hover:border-pink-500/40 transition-all duration-300 group">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="text-lg font-bold text-pink-300 mb-2">Private by Default</h3>
              <p className="text-sm text-pink-200/60">Your data, your keys. No intermediaries, no tracking, no surveillance</p>
            </div>

            <div className="p-6 bg-slate-900/40 backdrop-blur-md border border-purple-500/20 rounded-xl hover:border-purple-500/40 transition-all duration-300 group">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🌊</div>
              <h3 className="text-lg font-bold text-purple-300 mb-2">Always Available</h3>
              <p className="text-sm text-purple-200/60">Distributed across the IPFS network for maximum resilience</p>
            </div>
          </div>

          {/* Footer text */}
          <div className="pt-12 text-center">
            <p className="text-purple-400/40 text-xs font-mono tracking-wider">
              POWERED BY IPFS • BUILT FOR CYPHERPUNKS
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .bg-300\\% {
          background-size: 300%;
        }
      `}} />
    </div>
  );
}
