'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

export type AdminStatus = 'online' | 'away' | 'offline'

interface UseAdminStatusReturn {
  status: AdminStatus
  isLoading: boolean
}

// 폴링 간격 (30초)
const POLLING_INTERVAL = 30 * 1000
// 활동 업데이트 간격 (1분)
const ACTIVITY_INTERVAL = 60 * 1000
// 쓰로틀 간격 (5분) - 사용자 활동 이벤트로 인한 API 호출 제한
const THROTTLE_INTERVAL = 5 * 60 * 1000

export function useAdminStatus(): UseAdminStatusReturn {
  const { data: session } = useSession()
  const [status, setStatus] = useState<AdminStatus>('offline')
  const [isLoading, setIsLoading] = useState(true)
  const lastActivityUpdateRef = useRef<number>(0)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateActivity = useCallback(async () => {
    if (session?.user?.role !== 'admin') return

    try {
      await fetch('/api/admin/status', { method: 'POST' })
    } catch {
      // silently fail
    }
  }, [session?.user?.role])

  // 쓰로틀링이 적용된 활동 업데이트
  const throttledUpdateActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityUpdateRef.current >= THROTTLE_INTERVAL) {
      lastActivityUpdateRef.current = now
      updateActivity()
    }
  }, [updateActivity])

  useEffect(() => {
    // 초기 상태 조회
    fetchStatus()

    // 주기적으로 상태 폴링
    const statusInterval = setInterval(fetchStatus, POLLING_INTERVAL)

    return () => {
      clearInterval(statusInterval)
    }
  }, [fetchStatus])

  useEffect(() => {
    // 관리자인 경우 활동 업데이트
    if (session?.user?.role !== 'admin') return

    // 초기 활동 업데이트
    lastActivityUpdateRef.current = Date.now()
    updateActivity()

    // 주기적으로 활동 업데이트
    const activityInterval = setInterval(updateActivity, ACTIVITY_INTERVAL)

    // 사용자 활동 감지 (쓰로틀링 적용)
    const handleActivity = () => {
      throttledUpdateActivity()
    }

    window.addEventListener('mousemove', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity, { passive: true })
    window.addEventListener('click', handleActivity, { passive: true })
    window.addEventListener('scroll', handleActivity, { passive: true })

    return () => {
      clearInterval(activityInterval)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
    }
  }, [session?.user?.role, updateActivity, throttledUpdateActivity])

  return { status, isLoading }
}
