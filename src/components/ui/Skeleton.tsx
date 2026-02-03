interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClass =
    'animate-pulse bg-slate-200 dark:bg-slate-700'

  const variantClass = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${variantClass.text} h-4 ${className}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      style={style}
    />
  )
}

// 프리셋 컴포넌트
export function SkeletonCard() {
  return (
    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
      <Skeleton variant="rectangular" height={120} />
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" lines={2} />
    </div>
  )
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />
}

export function SkeletonPost() {
  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={36} />
        <div className="flex-1 space-y-1">
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="text" width="20%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" width="80%" height={18} />
      <Skeleton variant="text" lines={2} />
    </div>
  )
}
