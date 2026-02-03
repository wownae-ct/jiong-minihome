'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { profileSchema, ProfileInput } from '@/lib/validations/profile'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: ProfileInput
}

export function ProfileEditModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProfileEditModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData || {
      name: '',
      title: '',
      quote: '',
      email: '',
      github: '',
      linkedin: '',
      website: '',
      imageUrl: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
      if (initialData.imageUrl) {
        setPreviewUrl(initialData.imageUrl)
      }
    }
  }, [initialData, reset])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsUploading(true)

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
      setValue('imageUrl', result.url)
      setPreviewUrl(result.url)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setValue('imageUrl', '')
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: ProfileInput) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '프로필 업데이트에 실패했습니다.')
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

  const inputClasses =
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
  const labelClasses = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'
  const errorClasses = 'text-sm text-red-500 mt-1'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로필 수정" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelClasses}>
              이름
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={inputClasses}
              placeholder="이름을 입력하세요"
            />
            {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="title" className={labelClasses}>
              직함
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={inputClasses}
              placeholder="직함을 입력하세요"
            />
            {errors.title && <p className={errorClasses}>{errors.title.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="quote" className={labelClasses}>
            인용문
          </label>
          <textarea
            id="quote"
            {...register('quote')}
            className={`${inputClasses} resize-none`}
            rows={2}
            placeholder="프로필에 표시될 인용문을 입력하세요"
          />
          {errors.quote && <p className={errorClasses}>{errors.quote.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className={labelClasses}>
            이메일
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={inputClasses}
            placeholder="이메일 주소를 입력하세요"
          />
          {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClasses}>프로필 이미지</label>
          <div className="flex items-start gap-4">
            {/* 이미지 프리뷰 */}
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-700/50">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="프로필 프리뷰"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="person" size="lg" className="text-slate-400" />
              )}
            </div>

            {/* 업로드 버튼 */}
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-image-upload"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {isUploading ? (
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
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
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
          <input type="hidden" {...register('imageUrl')} />
          {errors.imageUrl && <p className={errorClasses}>{errors.imageUrl.message}</p>}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            소셜 링크
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="github" className={labelClasses}>
                GitHub URL
              </label>
              <input
                id="github"
                type="url"
                {...register('github')}
                className={inputClasses}
                placeholder="https://github.com/username"
              />
              {errors.github && <p className={errorClasses}>{errors.github.message}</p>}
            </div>

            <div>
              <label htmlFor="linkedin" className={labelClasses}>
                LinkedIn URL
              </label>
              <input
                id="linkedin"
                type="url"
                {...register('linkedin')}
                className={inputClasses}
                placeholder="https://linkedin.com/in/username"
              />
              {errors.linkedin && <p className={errorClasses}>{errors.linkedin.message}</p>}
            </div>

            <div>
              <label htmlFor="website" className={labelClasses}>
                웹사이트 URL
              </label>
              <input
                id="website"
                type="url"
                {...register('website')}
                className={inputClasses}
                placeholder="https://example.com"
              />
              {errors.website && <p className={errorClasses}>{errors.website.message}</p>}
            </div>
          </div>
        </div>

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
