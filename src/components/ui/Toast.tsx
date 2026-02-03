'use client'

import { useEffect, useState } from 'react'
import { Icon } from './Icon'

export interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

const typeConfig = {
  success: {
    icon: 'check_circle',
    bgClass: 'bg-green-500',
    textClass: 'text-green-500',
  },
  error: {
    icon: 'error',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
  },
  warning: {
    icon: 'warning',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-500',
  },
  info: {
    icon: 'info',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
  },
}

export function Toast({
  id,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const config = typeConfig[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
        transform transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`${config.textClass}`}>
        <Icon name={config.icon} size="sm" />
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Icon name="close" size="sm" />
      </button>
    </div>
  )
}
