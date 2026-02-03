'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { careerItemSchema, CareerItem } from '@/lib/validations/admin-content'

const formCareerSchema = z.object({
  id: z.number().optional(),
  company: z.string().min(1, '회사명을 입력해주세요'),
  position: z.string().min(1, '직책을 입력해주세요'),
  period: z.string().min(1, '기간을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  skills: z.string(),
  isCurrent: z.boolean(),
})

const formSchema = z.object({
  careers: z.array(formCareerSchema),
})

type FormData = z.infer<typeof formSchema>

interface CareerEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: CareerItem[]
}

export function CareerEditModal({ isOpen, onClose, onSuccess, initialData }: CareerEditModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const convertToFormData = (data: CareerItem[]) =>
    data.map((item) => ({
      ...item,
      skills: Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || ''),
    }))

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      careers: initialData ? convertToFormData(initialData) : [],
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'careers',
  })

  useEffect(() => {
    if (initialData) {
      reset({ careers: convertToFormData(initialData) })
    }
  }, [initialData, reset])

  const onSubmit = async (data: FormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const careersWithIds = data.careers.map((career, index) => ({
        ...career,
        id: career.id || Date.now() + index,
        skills: career.skills.split(',').map((s) => s.trim()).filter(Boolean),
      }))

      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'careers', data: careersWithIds }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '업데이트에 실패했습니다.')
        return
      }

      onSuccess?.()
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addNewCareer = () => {
    append({
      company: '',
      position: '',
      period: '',
      description: '',
      skills: '',
      isCurrent: false,
    })
  }

  const inputClasses =
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm'
  const labelClasses = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="경력 수정" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {fields.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Icon name="work_outline" size="xl" className="mx-auto mb-2" />
            <p>등록된 경력이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    경력 #{index + 1}
                  </span>
                  <div className="flex gap-2">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => move(index, index - 1)}
                        className="p-1 text-slate-500 hover:text-primary"
                      >
                        <Icon name="arrow_upward" size="sm" />
                      </button>
                    )}
                    {index < fields.length - 1 && (
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        className="p-1 text-slate-500 hover:text-primary"
                      >
                        <Icon name="arrow_downward" size="sm" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Icon name="delete" size="sm" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasses}>회사명</label>
                    <input
                      {...register(`careers.${index}.company`)}
                      className={inputClasses}
                      placeholder="회사명"
                    />
                    {errors.careers?.[index]?.company && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.careers[index]?.company?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClasses}>직책</label>
                    <input
                      {...register(`careers.${index}.position`)}
                      className={inputClasses}
                      placeholder="직책"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>기간</label>
                    <input
                      {...register(`careers.${index}.period`)}
                      className={inputClasses}
                      placeholder="2022.03 - 현재"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register(`careers.${index}.isCurrent`)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <label className="text-sm text-slate-700 dark:text-slate-300">현재 재직중</label>
                  </div>
                </div>

                <div className="mt-3">
                  <label className={labelClasses}>설명</label>
                  <textarea
                    {...register(`careers.${index}.description`)}
                    className={`${inputClasses} resize-none`}
                    rows={2}
                    placeholder="업무 내용을 설명해주세요"
                  />
                </div>

                <div className="mt-3">
                  <label className={labelClasses}>기술 스택 (쉼표로 구분)</label>
                  <input
                    {...register(`careers.${index}.skills`)}
                    className={inputClasses}
                    placeholder="AWS, Kubernetes, Docker"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addNewCareer}
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="add" size="sm" />새 경력 추가
        </button>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
