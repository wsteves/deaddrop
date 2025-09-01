import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dropout';
  size?: 'sm' | 'md' | 'lg';
};

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white'
  
  const variants = {
    primary: 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] hover:transform hover:-translate-y-0.5 hover:shadow-md focus:ring-[var(--accent-primary)] active:transform active:translate-y-0',
    secondary: 'border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent hover:bg-[var(--accent-light)] hover:text-[var(--accent-hover)] focus:ring-[var(--accent-primary)]',
    ghost: 'text-[var(--text-secondary)] bg-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus:ring-[var(--accent-primary)]',
    dropout: 'bg-gradient-to-r from-[var(--accent-dropout)] to-purple-500 text-white hover:from-purple-600 hover:to-purple-600 hover:transform hover:-translate-y-0.5 hover:shadow-md focus:ring-[var(--accent-dropout)] position-relative overflow-hidden'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-5 py-2.5 text-sm rounded-lg',
    lg: 'px-7 py-3.5 text-base rounded-lg'
  }
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
  <div className={`bg-[var(--card-bg)] backdrop-blur-sm rounded-[var(--radius)] shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
}

export const Input = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}: InputProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-1 focus:border-[var(--accent-primary)] hover:border-[var(--accent-light)] ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}

export const Textarea = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}: TextareaProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-1 focus:border-[var(--accent-primary)] hover:border-[var(--accent-light)] resize-y ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}
