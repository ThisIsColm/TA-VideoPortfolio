import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export function Input({ label, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[var(--text-xs)] uppercase tracking-[0.08em] font-medium text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 bg-[rgba(255,255,255,0.03)] border border-[var(--border-medium)] rounded-[var(--radius-md)] text-[var(--text-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-[var(--duration-fast)] focus:outline-none focus:border-white/30 focus:bg-[rgba(255,255,255,0.06)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3),var(--shadow-glow)] ${className}`}
        {...props}
      />
      {helperText && (
        <p className="mt-2 text-[var(--text-sm)] text-[var(--text-tertiary)]">{helperText}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
}

export function Textarea({ label, helperText, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[var(--text-xs)] uppercase tracking-[0.08em] font-medium text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`w-full min-h-[120px] p-4 bg-[rgba(255,255,255,0.03)] border border-[var(--border-medium)] rounded-[var(--radius-md)] text-[var(--text-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-[var(--duration-fast)] resize-vertical focus:outline-none focus:border-white/30 focus:bg-[rgba(255,255,255,0.06)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3),var(--shadow-glow)] ${className}`}
        {...props}
      />
      {helperText && (
        <p className="mt-2 text-[var(--text-sm)] text-[var(--text-tertiary)]">{helperText}</p>
      )}
    </div>
  );
}
