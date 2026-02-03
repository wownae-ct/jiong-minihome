'use client'

// import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'

// 방문자 통계 컴포넌트 - 임시 비활성화
// TODO: 추후 Vercel Analytics 또는 외부 서비스 연동 시 재활성화

// interface VisitorStats {
//   today: number
//   thisWeek: number
//   thisMonth: number
//   total: number
// }

// interface PageStats {
//   path: string
//   views: number
//   avgDuration: number
// }

export function VisitorAnalytics() {
  // 방문자 통계 기능 임시 비활성화
  // const [stats, setStats] = useState<VisitorStats | null>(null)
  // const [pageStats, setPageStats] = useState<PageStats[]>([])
  // const [isLoading, setIsLoading] = useState(true)

  // useEffect(() => {
  //   const fetchAnalytics = async () => {
  //     try {
  //       const response = await fetch('/api/admin/analytics')
  //       if (response.ok) {
  //         const data = await response.json()
  //         setStats(data.stats)
  //         setPageStats(data.pageStats || [])
  //       }
  //     } catch {
  //       // silently fail
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }

  //   fetchAnalytics()
  // }, [])

  // 준비중 상태 표시
  return (
    <div className="space-y-6">
      {/* 준비중 안내 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Icon name="construction" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              방문자 분석 기능 준비중
            </h3>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              더 나은 분석 기능을 제공하기 위해 서비스를 개선하고 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 비활성화된 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
        <StatCardDisabled label="오늘" icon="today" />
        <StatCardDisabled label="이번 주" icon="date_range" />
        <StatCardDisabled label="이번 달" icon="calendar_month" />
        <StatCardDisabled label="전체" icon="bar_chart" />
      </div>

      {/* 비활성화된 페이지별 통계 */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 opacity-50">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon name="analytics" size="sm" />
          페이지별 방문 통계
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          통계 기능이 준비중입니다.
        </p>
      </div>
    </div>
  )
}

function StatCardDisabled({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 flex items-center justify-center">
          <Icon name={icon} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-400 dark:text-slate-500">
            -
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

// 원본 StatCard 함수 (주석처리)
// function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
//   return (
//     <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
//       <div className="flex items-center gap-3">
//         <div className="p-2 bg-primary/10 rounded-lg text-primary">
//           <Icon name={icon} />
//         </div>
//         <div>
//           <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
//             {value.toLocaleString()}
//           </p>
//           <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
//         </div>
//       </div>
//     </div>
//   )
// }

// function formatDuration(seconds: number): string {
//   if (seconds < 60) {
//     return `${seconds}초`
//   }
//   const minutes = Math.floor(seconds / 60)
//   const remainingSeconds = seconds % 60
//   return `${minutes}분 ${remainingSeconds}초`
// }
