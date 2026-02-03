'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { WriteButton } from '@/components/ui/WriteButton'
import { CareerEditModal } from '@/components/admin/CareerEditModal'
import { CareerDetailModal } from '@/components/admin/CareerDetailModal'
import { CareerItem } from '@/lib/validations/admin-content'

const defaultCareers: CareerItem[] = [
  {
    id: 1,
    company: '테크 컴퍼니',
    position: 'Senior Infrastructure Engineer',
    period: '2022.03 - 현재',
    description: '클라우드 인프라 설계 및 운영, Kubernetes 기반 컨테이너 환경 구축',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker'],
    isCurrent: true,
  },
  {
    id: 2,
    company: '스타트업 ABC',
    position: 'DevOps Engineer',
    period: '2020.01 - 2022.02',
    description: 'CI/CD 파이프라인 구축, 모니터링 시스템 도입 및 운영',
    skills: ['Jenkins', 'GitLab CI', 'Prometheus', 'Grafana'],
    isCurrent: false,
  },
  {
    id: 3,
    company: 'IT 서비스',
    position: 'System Administrator',
    period: '2018.06 - 2019.12',
    description: '온프레미스 서버 운영 및 관리, 네트워크 인프라 유지보수',
    skills: ['Linux', 'Windows Server', 'VMware', 'Network'],
    isCurrent: false,
  },
]

export function CareerContent() {
  const { data: session } = useSession()
  const [careers, setCareers] = useState<CareerItem[]>(defaultCareers)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCareer, setSelectedCareer] = useState<CareerItem | null>(null)

  const isAdmin = session?.user?.role === 'admin'

  const fetchCareers = async () => {
    try {
      const response = await fetch('/api/admin/content?type=careers')
      if (response.ok) {
        const { data } = await response.json()
        if (data && data.length > 0) {
          setCareers(data)
        }
      }
    } catch (error) {
      console.error('경력 로딩 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCareers()
  }, [])

  const handleEditSuccess = () => {
    fetchCareers()
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 relative">
      {/* 관리자 편집 버튼 */}
      {isAdmin && (
        <WriteButton
          onClick={() => setIsEditModalOpen(true)}
          title="경력 수정"
          className="absolute top-4 right-4"
        />
      )}

      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
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
