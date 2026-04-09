'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { Icon } from '@/components/ui/Icon'
import { WriteButton } from '@/components/ui/WriteButton'
import { CareerEditModal } from '@/components/admin/CareerEditModal'
import { CareerDetailModal } from '@/components/admin/CareerDetailModal'
import { useCareers } from '@/hooks/useCareers'
import { CareerItem } from '@/lib/validations/admin-content'

export function CareerContent() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  // R5: 기존 useState + useEffect + fetch 패턴을 react-query로 교체
  // - 캐싱/중복 제거/자동 재검증 등 react-query 이점 확보
  // - 다른 content 컴포넌트(usePortfolios, useDiaries)와 일관성
  const { data: careers = [], isLoading } = useCareers()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCareer, setSelectedCareer] = useState<CareerItem | null>(null)

  const isAdmin = session?.user?.role === 'admin'

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['careers'] })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700 relative">
      {/* 관리자 편집 버튼 */}
      {isAdmin && (
        <WriteButton
          onClick={() => setIsEditModalOpen(true)}
          title="경력 수정"
          className="absolute top-4 right-4"
        />
      )}

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <span className="text-primary">경력</span>
        <span className="text-slate-400 dark:text-slate-500">Career</span>
      </h2>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pl-12 animate-pulse">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5">
                <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/4 mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : careers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Icon name="work_outline" size="xl" className="mx-auto mb-2" />
          <p>등록된 경력이 없습니다.</p>
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              경력 추가하기
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-8">
            {careers.map((career) => (
              <div key={career.id} className="relative pl-12">
                <div
                  className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 ${
                    career.isCurrent
                      ? 'bg-primary border-primary'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                  }`}
                />

                <div
                  onClick={() => setSelectedCareer(career)}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                        {career.company}
                      </h3>
                      <p className="text-primary font-medium">{career.position}</p>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Icon name="calendar_today" size="sm" />
                      {career.period}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 mb-3">{career.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(career.skills) ? career.skills : []).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 경력 수정 모달 */}
      <CareerEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        initialData={careers}
      />

      {/* 경력 상세 모달 */}
      <CareerDetailModal
        isOpen={!!selectedCareer}
        onClose={() => setSelectedCareer(null)}
        career={selectedCareer}
      />
    </div>
  )
}
