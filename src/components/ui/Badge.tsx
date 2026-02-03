import { ReactNode } from 'react';

export interface BadgeProps {
  variant?: 'orange' | 'red' | 'green' | 'primary';
  pulse?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  red: 'bg-red-500 text-white',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  primary: 'bg-primary/10 text-primary',
};

const sizeClasses = {
  sm: 'text-[10px] px-1',
  md: 'text-xs px-2 py-0.5',
};

export function Badge({ variant = 'orange', pulse = false, size = 'md', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`rounded-full uppercase tracking-tighter ${variantClasses[variant]} ${sizeClasses[size]} ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
