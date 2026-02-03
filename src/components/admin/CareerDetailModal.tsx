'use client'

import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { CareerItem } from '@/lib/validations/admin-content'

interface CareerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  career: CareerItem | null
}

export function CareerDetailModal({ isOpen, onClose, career }: CareerDetailModalProps) {
  if (!career) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="경력 상세" size="lg">
      <div className="space-y-6">
        {/* 회사 및 직책 */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {career.company}
            </h3>
            <p className="text-primary font-medium">{career.position}</p>
          </div>
          <div className="flex items-center gap-2">
            {career.isCurrent && (
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                재직 중
              </span>
            )}
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Icon name="calendar_today" size="sm" />
              {career.period}
            </span>
          </div>
        </div>

        {/* 설명 */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            업무 내용
          </h4>
          <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {career.description}
          </p>
        </div>

        {/* 상세 내용 (있는 경우) */}
        {career.details && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              상세 업무
            </h4>
            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {career.details}
            </p>
          </div>
        )}

        {/* 성과 (있는 경우) */}
        {career.achievements && career.achievements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              주요 성과
            </h4>
            <ul className="space-y-2">
              {career.achievements.map((achievement, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-slate-600 dark:text-slate-400"
                >
                  <Icon name="check_circle" size="sm" className="text-green-500 mt-0.5" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 프로젝트 (있는 경우) */}
        {career.projects && career.projects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              참여 프로젝트
            </h4>
            <ul className="space-y-2">
              {career.projects.map((project, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-slate-600 dark:text-slate-400"
                >
                  <Icon name="folder" size="sm" className="text-primary mt-0.5" />
                  <span>{project}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 기술 스택 */}
        {career.skills && career.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              사용 기술
            </h4>
            <div className="flex flex-wrap gap-2">
              {career.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
