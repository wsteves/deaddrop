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
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-8 rounded-3xl shadow-2xl border border-purple-400/20 backdrop-blur-sm">
                <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
                {/* Decorative droplets */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-400 rounded-full opacity-60 animate-ping" />
                <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-400 rounded-full opacity-60 animate-ping" style={{animationDelay: '0.5s'}} />
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
            <div className="group px-5 py-2.5 bg-purple-500/10 border border-purple-400/40 rounded-full backdrop-blur-sm hover:bg-purple-500/20 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
              <span className="flex items-center gap-2 text-purple-200 text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                End-to-end encrypted
              </span>
            </div>
            <div className="group px-5 py-2.5 bg-pink-500/10 border border-pink-400/40 rounded-full backdrop-blur-sm hover:bg-pink-500/20 transition-all hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20">
              <span className="flex items-center gap-2 text-pink-200 text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Lightning fast
              </span>
            </div>
            <div className="group px-5 py-2.5 bg-purple-500/10 border border-purple-400/40 rounded-full backdrop-blur-sm hover:bg-purple-500/20 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
              <span className="flex items-center gap-2 text-purple-200 text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Distributed network
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
            <Link to="/upload" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-300" />
              <button className="relative px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/60 transition-all duration-300 flex items-center gap-3 group-hover:scale-105">
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <span>Drop a file</span>
                <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </Link>

            <Link to="/browse" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-300" />
              <button className="relative px-10 py-5 bg-slate-900/90 backdrop-blur-md border-2 border-purple-400/40 rounded-2xl text-purple-200 font-bold text-lg hover:border-purple-400/70 hover:bg-slate-900 transition-all duration-300 flex items-center gap-3 group-hover:scale-105">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <span>Browse files</span>
              </button>
            </Link>
          </div>

          {/* Info section */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="relative p-6 bg-slate-900/40 backdrop-blur-md border border-purple-500/20 rounded-2xl hover:border-purple-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-purple-200 mb-2">Drop & Share</h3>
                <p className="text-sm text-purple-300/70 leading-relaxed">Upload files instantly to IPFS and share via content-addressed links</p>
              </div>
            </div>

            <div className="relative p-6 bg-slate-900/40 backdrop-blur-md border border-pink-500/20 rounded-2xl hover:border-pink-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-pink-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-pink-200 mb-2">Private by Default</h3>
                <p className="text-sm text-pink-300/70 leading-relaxed">Your data, your keys. No intermediaries, no tracking, no surveillance</p>
              </div>
            </div>

            <div className="relative p-6 bg-slate-900/40 backdrop-blur-md border border-purple-500/20 rounded-2xl hover:border-purple-400/50 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-purple-200 mb-2">Always Available</h3>
                <p className="text-sm text-purple-300/70 leading-relaxed">Distributed across the IPFS network for maximum resilience</p>
              </div>
            </div>
          </div>

          {/* Footer text */}
          <div className="pt-12 text-center">
            <p className="text-purple-400/40 text-xs font-mono tracking-wider">
              POWERED BY POLKADOT & IPFS • BUILT FOR CYPHERPUNKS
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
