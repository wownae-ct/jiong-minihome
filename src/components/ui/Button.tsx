import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  children?: ReactNode;
}

const variantClasses = {
  primary: 'bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md shadow-blue-500/20',
  ghost: 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400',
  icon: 'p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700',
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`transition-all flex items-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </button>
  );
}
