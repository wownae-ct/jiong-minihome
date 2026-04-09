'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface LightboxImage {
  src: string
  alt?: string
}

interface LightboxInstance {
  init: () => void
  loadAndOpen: (index: number) => void
  destroy: () => void
}

/**
 * PhotoSwipe v5 기반 라이트박스 훅.
 *
 * 사용법:
 * ```tsx
 * const { openLightbox } = useLightbox()
 * <img onClick={() => openLightbox({ src, alt })} />
 * ```
 *
 * PhotoSwipe 모듈은 lazy import되며 최초 호출 시에만 로드됩니다.
 * 컴포넌트 unmount 시 마지막 인스턴스는 자동 destroy됩니다.
 */
export function useLightbox() {
  const lightboxRef = useRef<LightboxInstance | null>(null)

  useEffect(() => {
    return () => {
      lightboxRef.current?.destroy()
      lightboxRef.current = null
    }
  }, [])

  const openLightbox = useCallback(async ({ src, alt = '' }: LightboxImage) => {
    const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox')

    const { width, height } = await measureImage(src)

    // 이전 인스턴스 정리 (같은 훅에서 다른 이미지를 열 경우)
    lightboxRef.current?.destroy()

    const lightbox = new PhotoSwipeLightbox({
      dataSource: [{ src, width, height, alt }],
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.9,
      showHideAnimationType: 'fade',
      closeOnVerticalDrag: true,
      padding: { top: 20, bottom: 20, left: 0, right: 0 },
    }) as unknown as LightboxInstance

    lightbox.init()
    lightbox.loadAndOpen(0)
    lightboxRef.current = lightbox
  }, [])

  return { openLightbox }
}

function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ width: 1920, height: 1080 })
      return
    }
    const img = new window.Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
      })
    }
    img.onerror = () => resolve({ width: 1920, height: 1080 })
    img.src = src
  })
}
