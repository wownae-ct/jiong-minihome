interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fill?: boolean;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

export function Icon({ name, size = 'md', className = '', fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
