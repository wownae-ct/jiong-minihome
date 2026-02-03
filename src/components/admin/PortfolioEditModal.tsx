'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { PortfolioItem } from '@/lib/validations/admin-content'

const formPortfolioSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  image: z.string().nullable(),
  tags: z.string(),
  githubUrl: z.string(),
  demoUrl: z.string(),
  featured: z.boolean(),
})

const formSchema = z.object({
  portfolios: z.array(formPortfolioSchema),
})

type FormData = z.infer<typeof formSchema>

interface PortfolioEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: PortfolioItem[]
}

export function PortfolioEditModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: PortfolioEditModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<number, string | null>>({})
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const convertToFormData = (data: PortfolioItem[]) =>
    data.map((item) => ({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      githubUrl: item.githubUrl || '',
      demoUrl: item.demoUrl || '',
    }))

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      portfolios: initialData ? convertToFormData(initialData) : [],
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'portfolios',
  })

  useEffect(() => {
    if (initialData) {
      reset({ portfolios: convertToFormData(initialData) })
      // 초기 이미지 프리뷰 설정
      const initialPreviews: Record<number, string | null> = {}
      initialData.forEach((item, index) => {
        if (item.image) {
          initialPreviews[index] = item.image
        }
      })
      setPreviewUrls(initialPreviews)
    }
  }, [initialData, reset])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 검증
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('이미지 파일만 업로드할 수 있습니다. (jpg, jpeg, png, gif, webp)')
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setError(null)
    setUploadingIndex(index)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '이미지 업로드에 실패했습니다.')
        return
      }

      // 업로드 성공 시 폼 값과 프리뷰 업데이트
      setValue(`portfolios.${index}.image`, result.url)
      setPreviewUrls(prev => ({ ...prev, [index]: result.url }))
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleRemoveImage = (index: number) => {
    setValue(`portfolios.${index}.image`, null)
    setPreviewUrls(prev => ({ ...prev, [index]: null }))
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = ''
    }
  }

  const onSubmit = async (data: FormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const portfoliosWithIds = data.portfolios.map((portfolio, index) => ({
        ...portfolio,
        id: portfolio.id || Date.now() + index,
        tags: portfolio.tags.split(',').map((s) => s.trim()).filter(Boolean),
      }))

      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'portfolios', data: portfoliosWithIds }),
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

  const addNewPortfolio = () => {
    append({
      title: '',
      description: '',
      image: null,
      tags: '',
      githubUrl: '',
      demoUrl: '',
      featured: false,
    })
  }

  const inputClasses =
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm'
  const labelClasses = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="포트폴리오 수정" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {fields.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Icon name="folder_open" size="xl" className="mx-auto mb-2" />
            <p>등록된 포트폴리오가 없습니다.</p>
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
                    프로젝트 #{index + 1}
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
                    <label className={labelClasses}>제목</label>
                    <input
                      {...register(`portfolios.${index}.title`)}
                      className={inputClasses}
                      placeholder="프로젝트 제목"
                    />
                    {errors.portfolios?.[index]?.title && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.portfolios[index]?.title?.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      {...register(`portfolios.${index}.featured`)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <label className="text-sm text-slate-700 dark:text-slate-300">
                      Featured 프로젝트
                    </label>
                  </div>
                </div>

                <div className="mt-3">
                  <label className={labelClasses}>설명</label>
                  <textarea
                    {...register(`portfolios.${index}.description`)}
                    className={`${inputClasses} resize-none`}
                    rows={2}
                    placeholder="프로젝트에 대한 설명을 입력해주세요"
                  />
                </div>

                <div className="mt-3">
                  <label className={labelClasses}>태그 (쉼표로 구분)</label>
                  <input
                    {...register(`portfolios.${index}.tags`)}
                    className={inputClasses}
                    placeholder="AWS, Kubernetes, Docker"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelClasses}>GitHub URL</label>
                    <input
                      {...register(`portfolios.${index}.githubUrl`)}
                      className={inputClasses}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Demo URL</label>
                    <input
                      {...register(`portfolios.${index}.demoUrl`)}
                      className={inputClasses}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className={labelClasses}>프로젝트 이미지 (선택)</label>
                  <div className="flex items-start gap-4">
                    {/* 이미지 프리뷰 */}
                    <div className="w-24 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-700/50">
                      {previewUrls[index] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrls[index]!}
                          alt="프로젝트 이미지 프리뷰"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon name="image" size="md" className="text-slate-400" />
                      )}
                    </div>

                    {/* 업로드 버튼 */}
                    <div className="flex-1 space-y-2">
                      <input
                        ref={(el) => { fileInputRefs.current[index] = el }}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={(e) => handleImageUpload(e, index)}
                        className="hidden"
                        id={`portfolio-image-upload-${index}`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {uploadingIndex === index ? (
                            <>
                              <Icon name="hourglass_empty" size="sm" className="animate-spin" />
                              업로드 중...
                            </>
                          ) : (
                            <>
                              <Icon name="upload" size="sm" />
                              이미지 선택
                            </>
                          )}
                        </button>
                        {previewUrls[index] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Icon name="delete" size="sm" />
                            삭제
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        JPG, PNG, GIF, WebP (최대 5MB)
                      </p>
                    </div>
                  </div>
                  {/* hidden input for form data */}
                  <input type="hidden" {...register(`portfolios.${index}.image`)} />
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addNewPortfolio}
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="add" size="sm" />새 프로젝트 추가
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
