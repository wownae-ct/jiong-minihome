interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

export function Icon({ name, size = 'md', className = '' }: IconProps) {
  return (
    <span className={`material-symbols-outlined inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {name}
    </span>
  );
}
