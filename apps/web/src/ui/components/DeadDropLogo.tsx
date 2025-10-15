import React from 'react';

interface DeadDropLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showText?: boolean;
}

export function DeadDropLogo({ size = 'md', animated = true, showText = true }: DeadDropLogoProps) {
  const sizes = {
    sm: { container: 'w-10 h-10', text: 'text-sm' },
    md: { container: 'w-14 h-14', text: 'text-base' },
    lg: { container: 'w-20 h-20', text: 'text-xl' },
    xl: { container: 'w-32 h-32', text: 'text-3xl' }
  };

  const { container, text } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* Simple Document Logo */}
      <div className={`${container} relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simple Document Icon */}
          <g>
            {/* Document body */}
            <path 
              d="M 30 20 
                 L 30 80 
                 L 70 80 
                 L 70 35 
                 L 55 20 
                 Z" 
              fill="rgba(139,92,246,0.1)"
              stroke="#a78bfa"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            
            {/* Folded corner */}
            <path 
              d="M 55 20 L 55 35 L 70 35" 
              fill="rgba(139,92,246,0.2)"
              stroke="#a78bfa"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            
            {/* Document content lines */}
            <line x1="38" y1="45" x2="62" y2="45" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="38" y1="53" x2="60" y2="53" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="38" y1="61" x2="62" y2="61" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="38" y1="69" x2="55" y2="69" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
          </g>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`${text} font-black tracking-tight leading-none`}>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Dead Drop
            </span>
          </div>
          {/* {size !== 'sm' && (
            <div className="text-[0.6em] text-purple-400/60 font-medium tracking-wider uppercase opacity-75 mt-0.5">
              Decentralized
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}
