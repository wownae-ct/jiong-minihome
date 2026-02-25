'use client'

import { useState, useEffect } from 'react'

interface ProfileAvatarProps {
  src: string | null | undefined
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
} as const

const TEXT_SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
} as const

export function ProfileAvatar({ src, alt, size = 'md', className = '' }: ProfileAvatarProps) {
  const [hasError, setHasError] = useState(false)

  // src가 변경되면 에러 상태 리셋
  useEffect(() => {
    setHasError(false)
  }, [src])

  const sizeClass = SIZE_CLASSES[size]
  const textSize = TEXT_SIZE_CLASSES[size]

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium ${textSize} ${className}`}
      >
        {alt[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClass} rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  )
}
