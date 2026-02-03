'use client'

// import { useEffect, useState } from 'react'

// 방문자 카운터 - 임시 비활성화
// TODO: 추후 Vercel Analytics 또는 외부 서비스 연동 시 재활성화

// interface VisitorStats {
//   today: number
//   total: number
// }

export function VisitorCounter() {
  // 방문자 통계 기능 임시 비활성화
  // const [stats, setStats] = useState<VisitorStats>({ today: 0, total: 0 })
  // const [isLoaded, setIsLoaded] = useState(false)

  // useEffect(() => {
  //   // 방문 기록
  //   fetch('/api/stats/visitors', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ pagePath: window.location.pathname }),
  //   }).catch(console.error)

  //   // 통계 조회
  //   fetch('/api/stats/visitors')
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setStats(data)
  //       setIsLoaded(true)
  //     })
  //     .catch(console.error)
  // }, [])

  return (
    <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
      <div className="flex justify-between text-xs font-mono text-slate-400">
        <span>TODAY -</span>
        <span>TOTAL -</span>
      </div>
      <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center mt-1">
        통계 준비중
      </p>
    </div>
  )
}
