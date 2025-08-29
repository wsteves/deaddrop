import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant='primary', size='md', className='', children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition';
  const sizes: Record<string,string> = { sm: 'px-3 py-1 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  const variants: Record<string,string> = {
  primary: 'bg-[linear-gradient(90deg,var(--accent-from),var(--accent-to))] text-white shadow-sm',
  secondary: 'bg-transparent text-slate-200 border border-transparent hover:border-slate-600',
  ghost: 'bg-transparent text-slate-200'
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--card-bg)] backdrop-blur-sm rounded-[var(--radius)] shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Input({ className = '', ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`w-full rounded-lg px-3 py-2 bg-[rgba(255,255,255,0.02)] placeholder:text-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-from)] ${className}`} {...rest} />
  );
}

export function Textarea({ className = '', ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`w-full rounded-lg px-3 py-2 bg-[rgba(255,255,255,0.02)] placeholder:text-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-from)] ${className}`} {...rest} />
  );
}
