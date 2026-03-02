import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-[var(--duration-fast)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none';

  const variants = {
    primary: 'h-12 px-8 bg-white text-[var(--text-inverse)] hover:bg-[rgba(255,255,255,0.9)] hover:shadow-[var(--shadow-glow)] rounded-[var(--radius-md)]',
    secondary: 'h-12 px-8 bg-transparent border border-[var(--border-active)] text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.5)] hover:bg-[var(--accent-hover)] rounded-[var(--radius-md)]',
    ghost: 'px-4 py-2 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-hover)] rounded-[var(--radius-md)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props as any}
    >
      {children}
    </motion.button>
  );
}
