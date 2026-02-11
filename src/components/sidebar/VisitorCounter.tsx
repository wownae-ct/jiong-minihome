'use client'

import { useEffect, useState } from 'react'

interface VisitorStats {
  today: number
  total: number
}

export function VisitorCounter() {
  const [stats, setStats] = useState<VisitorStats | null>(null)

  useEffect(() => {
    // 방문 기록
    fetch('/api/stats/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagePath: window.location.pathname }),
    }).catch(console.error)

    // 통계 조회
    fetch('/api/stats/visitors')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
      })
      .catch(console.error)
  }, [])

  const formatNumber = (num: number) => num.toLocaleString('ko-KR')

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
      <div className="flex justify-between text-xs font-mono text-slate-400">
        <span>TODAY {stats ? formatNumber(stats.today) : '-'}</span>
        <span>TOTAL {stats ? formatNumber(stats.total) : '-'}</span>
      </div>
    </div>
  )
}
