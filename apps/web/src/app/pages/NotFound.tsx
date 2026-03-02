import React from 'react';
import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-[72px] leading-[76px] font-light text-[var(--text-primary)] mb-4 tracking-tight">
          404
        </h1>
        <p className="text-[18px] leading-[28px] text-[var(--text-secondary)] mb-8">
          Collection not found
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center h-12 px-8 bg-white text-[var(--text-inverse)] hover:bg-[rgba(255,255,255,0.9)] rounded-[var(--radius-sm)] font-medium transition-all duration-[var(--duration-fast)]"
        >
          Go to Admin
        </Link>
      </div>
    </div>
  );
}
