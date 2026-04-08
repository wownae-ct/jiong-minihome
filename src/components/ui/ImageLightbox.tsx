'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
}

export function ImageLightbox({ isOpen, onClose, src, alt = '' }: ImageLightboxProps) {
  const onCloseRef = useRef(onClose)
  const savedOverflowRef = useRef('')
  const closingRef = useRef(false)

  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return

    closingRef.current = false
    savedOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = savedOverflowRef.current
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    onCloseRef.current()
  }

  const handleBackdropPointerUp = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleClose()
  }

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        data-testid="lightbox-backdrop"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        onPointerUp={handleBackdropPointerUp}
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        aria-label="닫기"
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        className="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      />
    </div>
  )

  if (typeof window !== 'undefined') {
    return createPortal(lightboxContent, document.body)
  }

  return null
}
